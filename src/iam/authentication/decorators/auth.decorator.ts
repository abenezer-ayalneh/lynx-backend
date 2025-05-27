import { SetMetadata } from '@nestjs/common'

import AuthType from '../enums/auth-type.enum'

export const AUTH_TYPE_KEY = 'authType44'

export const Auth = (...authTypes: AuthType[]) => SetMetadata(AUTH_TYPE_KEY, authTypes)
