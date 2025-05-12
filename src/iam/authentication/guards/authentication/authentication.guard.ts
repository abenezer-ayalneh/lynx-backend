import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import AccessTokenGuard from '../access-token/access-token.guard'
import AuthType from '../../enums/auth-type.enum'
import { AUTH_TYPE_KEY } from '../../decorators/auth.decorator'

@Injectable()
export default class AuthenticationGuard implements CanActivate {
  private static readonly defaultAuthType = AuthType.Bearer

  private readonly authGuardMap: Record<AuthType, CanActivate | CanActivate[]> = {
    [AuthType.Bearer]: this.accessTokenGuard,
    [AuthType.None]: { canActivate: () => true },
  }

  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypes = this.reflector.getAllAndOverride<AuthType[]>(AUTH_TYPE_KEY, [context.getHandler(), context.getClass()]) ?? [
      AuthenticationGuard.defaultAuthType,
    ]

    const guards = authTypes.map((type: AuthType) => this.authGuardMap[type]).flat()
    let error = new UnauthorizedException()
    const canActivateArray = []

    guards.forEach((guard) => {
      canActivateArray.push(Promise.resolve(guard.canActivate(context)))
    })

    try {
      const data = await Promise.all(canActivateArray)

      for (let i = 0; i < data.length; i += 1) {
        const datum = data[i]
        if (datum) {
          return true
        }
      }
    } catch (err) {
      error = err
    }

    throw error
  }
}
