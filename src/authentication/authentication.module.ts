import { Module } from '@nestjs/common'

import AuthenticationController from './authentication.controller'
import AuthenticationService from './authentication.service'

@Module({
	providers: [AuthenticationService],
	controllers: [AuthenticationController],
})
export default class AuthenticationModule {}
