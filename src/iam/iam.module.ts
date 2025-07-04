import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'

import AuthenticationController from './authentication/authentication.controller'
import AuthenticationService from './authentication/authentication.service'
import AccessTokenGuard from './authentication/guards/access-token/access-token.guard'
import AuthenticationGuard from './authentication/guards/authentication/authentication.guard'
import RefreshTokenIdsStorage from './authentication/refresh-token-ids.storage/refresh-token-ids.storage'
import jwtConfig from './config/jwt.config'
import BcryptService from './hashing/bcrypt.service'
import HashingService from './hashing/hashing.service'

@Module({
	imports: [JwtModule.registerAsync(jwtConfig.asProvider()), ConfigModule.forFeature(jwtConfig)],
	providers: [
		{
			provide: HashingService,
			useClass: BcryptService,
		},
		{
			provide: APP_GUARD,
			useClass: AuthenticationGuard,
		},
		AccessTokenGuard,
		RefreshTokenIdsStorage,
		AuthenticationService,
	],
	controllers: [AuthenticationController],
})
export default class IamModule {}
