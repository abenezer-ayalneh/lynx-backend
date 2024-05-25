import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule } from '@nestjs/config'
import HashingService from './hashing/hashing.service'
import BcryptService from './hashing/bcrypt.service'
import AuthenticationController from './authentication/authentication.controller'
import AuthenticationService from './authentication/authentication.service'
import jwtConfig from './config/jwt.config'
import AccessTokenGuard from './authentication/guards/access-token/access-token.guard'
import RefreshTokenIdsStorage from './authentication/refresh-token-ids.storage/refresh-token-ids.storage'

@Module({
  imports: [
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
  ],
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    // FIXME enable this global guard to protect routes by default
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthenticationGuard,
    // },
    AccessTokenGuard,
    RefreshTokenIdsStorage,
    AuthenticationService,
  ],
  controllers: [AuthenticationController],
})
export default class IamModule {}
