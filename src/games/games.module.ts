import { Module } from '@nestjs/common'
import GameService from './games.service'
import GameController from './games.controller'

@Module({
  controllers: [GameController],
  providers: [GameService],
})
export default class GameModule {}
