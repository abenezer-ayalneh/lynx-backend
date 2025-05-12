import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
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
import { ActivePlayerData } from '../types/active-player-data.type'
import RefreshTokenDto from './dto/refresh-token.dto'
import RefreshTokenIdsStorage from './refresh-token-ids.storage/refresh-token-ids.storage'
import { RefreshTokenData } from '../types/refresh-token-data.type'
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
    const player = await this.prismaService.player.findFirst({
      where: { email: signInDto.email },
    })
    if (!player) {
      throw new UnauthorizedException('Player does not exists')
    }

    const isEqual = await this.hashingService.compare(signInDto.password, player.password)
    if (!isEqual) {
      throw new UnauthorizedException('Email or password mismatch')
    }

    return this.generateTokens(player)
  }

  async generateTokens(player: Player) {
    const refreshTokenId = randomUUID()
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActivePlayerData>>(player.id, this.jwtConfiguration.accessTokenTtl, { email: player.email }),
      this.signToken<Partial<RefreshTokenData>>(player.id, this.jwtConfiguration.refreshTokenTtl, { refreshTokenId }),
    ])
    await this.refreshTokenIdsStorage.insert(player.id, refreshTokenId)
    return { accessToken, refreshToken }
  }

  async signToken<T>(playerId: number, expiresIn: number, payload?: T) {
    return this.jwtService.signAsync(
      {
        sub: playerId,
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
      const { sub, refreshTokenId } = await this.jwtService.verifyAsync<Pick<ActivePlayerData, 'sub'> & RefreshTokenData>(refreshTokenDto.refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      })
      const player = await this.prismaService.player.findFirstOrThrow({
        where: { id: sub },
      })

      const isValid = await this.refreshTokenIdsStorage.validate(player.id, refreshTokenId)
      if (isValid) {
        await this.refreshTokenIdsStorage.invalidate(player.id)
      } else {
        throw new Error('Refresh token is invalid')
      }

      return await this.generateTokens(player)
    } catch (e) {
      if (e instanceof InvalidatedRefreshTokenError) {
        throw new UnauthorizedException('Access denied')
      }
      throw new UnauthorizedException()
    }
  }

  async checkToken(playerId: number) {
    return this.prismaService.player.findUnique({
      where: { id: playerId },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        score: true,
      },
    })
  }
}
