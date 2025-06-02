import { Controller, Get, Query } from '@nestjs/common'

import { GetTokenDto } from './dto/get-token.dto'
import { LiveKitService } from './live-kit.service'

// @Auth(AuthType.None)
@Controller('live-kit')
export class LiveKitController {
  constructor(private readonly liveKitService: LiveKitService) {}

  @Get('token')
  getToken(@Query() getTokenDto: GetTokenDto) {
    return this.liveKitService.getToken(getTokenDto)
  }
}
