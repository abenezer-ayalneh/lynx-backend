import { Module } from '@nestjs/common'
import LogicService from './logic.service'

@Module({
  providers: [LogicService],
})
export default class LogicModule {}
