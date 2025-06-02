import { Module } from '@nestjs/common'

import { LiveKitController } from './live-kit.controller'
import { LiveKitService } from './live-kit.service'

@Module({
  controllers: [LiveKitController],
  providers: [LiveKitService],
})
export class LiveKitModule {}
