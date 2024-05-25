import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { JwtService } from '@nestjs/jwt'
import { ConfigType } from '@nestjs/config'
import { randomUUID } from 'node:crypto'
import { Player } from '@prisma/client'
import PrismaService from '../../prisma/prisma.service'
import HashingService from '../hashing/hashing.service'
import SignUpDto from './dto/sign-up.dto/sign-up.dto'
import SignInDto from './dto/sign-in.dto/sign-in.dto'
import jwtConfig from '../config/jwt.config'
import { ActiveUserData } from '../interfaces/active-user-data.interface'
import RefreshTokenDto from './dto/refresh-token.dto'
import RefreshTokenIdsStorage from './refresh-token-ids.storage/refresh-token-ids.storage'
import { RefreshTokenData } from '../interfaces/refresh-token-data.interfaces'
import InvalidatedRefreshTokenError from '../errors/invalidated-refresh-token.error'

@Injectable()
export default class AuthenticationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    try {
      if (signUpDto.password !== signUpDto.confirmPassword) {
        throw Error('Password and confirm password mismatch')
      }
      const password = await this.hashingService.hash(signUpDto.password)
      await this.prismaService.player.create({
        data: { email: signUpDto.email, password, name: signUpDto.name },
      })
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException()
        }
      }
      throw e
    }
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.prismaService.player.findFirst({
      where: { email: signInDto.email },
    })
    if (!user) {
      throw new UnauthorizedException('User does not exists')
    }

    const isEqual = await this.hashingService.compare(
      signInDto.password,
      user.password,
    )
    if (!isEqual) {
      throw new UnauthorizedException('Email or password mismatch')
    }

    return this.generateTokens(user)
  }

  async generateTokens(user: Player) {
    const refreshTokenId = randomUUID()
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        { email: user.email },
      ),
      this.signToken<Partial<RefreshTokenData>>(
        user.id,
        this.jwtConfiguration.refreshTokenTtl,
        { refreshTokenId },
      ),
    ])
    await this.refreshTokenIdsStorage.insert(user.id, refreshTokenId)
    return { accessToken, refreshToken }
  }

  async signToken<T>(userId: number, expiresIn: number, payload?: T) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    )
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub, refreshTokenId } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'> & RefreshTokenData
      >(refreshTokenDto.refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      })
      const user = await this.prismaService.player.findFirstOrThrow({
        where: { id: sub },
      })

      const isValid = await this.refreshTokenIdsStorage.validate(
        user.id,
        refreshTokenId,
      )
      if (isValid) {
        await this.refreshTokenIdsStorage.invalidate(user.id)
      } else {
        throw new Error('Refresh token is invalid')
      }

      return await this.generateTokens(user)
    } catch (e) {
      if (e instanceof InvalidatedRefreshTokenError) {
        throw new UnauthorizedException('Access denied')
      }
      throw new UnauthorizedException()
    }
  }
}
