import { Controller, Get, Query } from '@nestjs/common'
import { OptionalAuth, Session, UserSession } from '@thallesp/nestjs-better-auth'

import { GetTokenDto } from './dto/get-token.dto'
import { LiveKitService } from './live-kit.service'

@OptionalAuth()
@Controller('live-kit')
export class LiveKitController {
	constructor(private readonly liveKitService: LiveKitService) {}

	@Get('token')
	getToken(@Session() session: UserSession | null, @Query() getTokenDto: GetTokenDto) {
		return this.liveKitService.getToken(session, getTokenDto)
	}
}
