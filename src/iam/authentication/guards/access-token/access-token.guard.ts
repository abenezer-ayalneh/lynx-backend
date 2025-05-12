import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigType } from '@nestjs/config'
import { Request } from 'express'
import jwtConfig from '../../../config/jwt.config'
import REQUEST_PLAYER_KEY from '../../../iam.constants'

@Injectable()
export default class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException()
    }

    try {
      request[REQUEST_PLAYER_KEY] = await this.jwtService.verifyAsync(token, this.jwtConfiguration)
    } catch (e) {
      throw new UnauthorizedException()
    }

    return true
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [, token] = request.headers.authorization?.split(' ') ?? []
    return token
  }
}
