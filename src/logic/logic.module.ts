import { Module } from '@nestjs/common'
import LogicService from './logic.service'
import ScheduledGamesModule from './scheduled-games/scheduled-games.module'
import GameModule from './games/games.module'

@Module({
  imports: [ScheduledGamesModule, GameModule],
  providers: [LogicService],
  exports: [LogicService],
})
export default class LogicModule {}
