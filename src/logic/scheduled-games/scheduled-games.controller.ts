import { Body, Controller, Get, Post, Query } from '@nestjs/common'

import { Auth } from '../../iam/authentication/decorators/auth.decorator'
import AuthType from '../../iam/authentication/enums/auth-type.enum'
import ActiveUser from '../../iam/decorators/active-user.decorator'
import { ActivePlayerData } from '../../iam/types/active-player-data.type'
import CreateMultiplayerRoomDto from './dto/create-multiplayer-room.dto'
import RsvpDto from './dto/rsvp.dto'
import ScheduledGamesService from './scheduled-games.service'

@Controller('scheduled-games')
export default class ScheduledGamesController {
  constructor(private readonly roomsService: ScheduledGamesService) {}

  @Post()
  async create(@ActiveUser() activePlayerData: ActivePlayerData, @Body() createRoomDto: CreateMultiplayerRoomDto) {
    return this.roomsService.create(activePlayerData, createRoomDto)
  }

  @Auth(AuthType.None)
  @Get('rsvp')
  rsvp(@Query() rsvpDto: RsvpDto) {
    return this.roomsService.rsvp(rsvpDto)
  }
}
