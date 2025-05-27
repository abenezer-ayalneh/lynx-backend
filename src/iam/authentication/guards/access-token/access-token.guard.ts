import { CanActivate, ExecutionContext, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'

import jwtConfig from '../../../config/jwt.config'
import REQUEST_PLAYER_KEY from '../../../iam.constants'
import { ActivePlayerData } from '../../../types/active-player-data.type'

@Injectable()
export default class AccessTokenGuard implements CanActivate {
  logger: Logger

  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {
    this.logger = new Logger('AccessTokenGuard')
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException()
    }

    try {
      request[REQUEST_PLAYER_KEY] = await this.jwtService.verifyAsync<ActivePlayerData | undefined>(token, this.jwtConfiguration)
    } catch (e) {
      this.logger.error(e)
      throw new UnauthorizedException()
    }

    return true
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [, token] = request.headers.authorization?.split(' ') ?? []
    return token
  }
}
