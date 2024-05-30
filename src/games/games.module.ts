import { Module } from '@nestjs/common'
import GameService from './games.service'
import GameController from './games.controller'
import LogicModule from '../logic/logic.module'

@Module({
  imports: [LogicModule],
  controllers: [GameController],
  providers: [GameService],
})
export default class GameModule {}
