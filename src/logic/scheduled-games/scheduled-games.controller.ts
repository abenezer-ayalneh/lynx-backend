import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import ScheduledGamesService from './scheduled-games.service'
import CreateRoomDto from './dto/create-room.dto'
import ActiveUser from '../../iam/decorators/active-user.decorator'
import RsvpDto from './dto/rsvp.dto'
import { Auth } from '../../iam/authentication/decorators/auth.decorator'
import AuthType from '../../iam/authentication/enums/auth-type.enum'

@Controller('scheduled-games')
export default class ScheduledGamesController {
  constructor(private readonly roomsService: ScheduledGamesService) {}

  @Post()
  create(
    @ActiveUser('sub') playerId: string,
    @Body() createRoomDto: CreateRoomDto,
  ) {
    return this.roomsService.create(Number(playerId), createRoomDto)
  }

  @Auth(AuthType.None)
  @Get('rsvp')
  rsvp(@Query() rsvpDto: RsvpDto) {
    return this.roomsService.rsvp(rsvpDto)
  }

  // @Get()
  // findAll() {
  //   return this.roomsService.findAll()
  // }
  //
  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.roomsService.findOne(+id)
  // }
  //
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
  //   return this.roomsService.update(+id, updateRoomDto)
  // }
  //
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.roomsService.remove(+id)
  // }
}
