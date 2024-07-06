import { Module } from '@nestjs/common'
import LogicService from './logic.service'
import RoomsModule from './rooms/rooms.module'
import GameModule from './games/games.module'

@Module({
  imports: [RoomsModule, GameModule],
  providers: [LogicService],
  exports: [LogicService],
})
export default class LogicModule {}
