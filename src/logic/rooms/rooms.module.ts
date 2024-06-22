import { Module } from '@nestjs/common'
import RoomsService from './rooms.service'
import RoomsController from './rooms.controller'

@Module({
  controllers: [RoomsController],
  providers: [RoomsService],
})
export default class RoomsModule {}
