import { Module } from '@nestjs/common'
import LogicService from './logic.service'

@Module({
  providers: [LogicService],
  exports: [LogicService],
})
export default class LogicModule {}
