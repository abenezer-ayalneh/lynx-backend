import { Controller, Get, Query } from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'

import { GetTokenDto } from './dto/get-token.dto'
import { LiveKitService } from './live-kit.service'

@AllowAnonymous()
@Controller('live-kit')
export class LiveKitController {
	constructor(private readonly liveKitService: LiveKitService) {}

	@Get('token')
	getToken(@Query() getTokenDto: GetTokenDto) {
		return this.liveKitService.getToken(getTokenDto)
	}
}
