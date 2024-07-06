import { Module } from '@nestjs/common'
import RoomsService from './rooms.service'
import RoomsController from './rooms.controller'
import GameModule from '../games/games.module'

@Module({
  imports: [GameModule],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export default class RoomsModule {}
