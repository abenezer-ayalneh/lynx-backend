import { Module } from '@nestjs/common'
import RoomsModule from './rooms/rooms.module'
import LogicService from './logic.service'

@Module({
  providers: [LogicService],
  exports: [LogicService],
  imports: [RoomsModule],
})
export default class LogicModule {}
