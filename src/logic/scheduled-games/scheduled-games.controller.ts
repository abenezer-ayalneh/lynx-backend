import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import ScheduledGamesService from './scheduled-games.service'
import CreateMultiplayerRoomDto from './dto/create-multiplayer-room.dto'
import ActiveUser from '../../iam/decorators/active-user.decorator'
import RsvpDto from './dto/rsvp.dto'
import { Auth } from '../../iam/authentication/decorators/auth.decorator'
import AuthType from '../../iam/authentication/enums/auth-type.enum'
import { ActivePlayerData } from '../../iam/types/active-player-data.type'

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
