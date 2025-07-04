import { Body, Controller, Get, Param, Post } from '@nestjs/common'

import { Auth } from '../../iam/authentication/decorators/auth.decorator'
import AuthType from '../../iam/authentication/enums/auth-type.enum'
import ActiveUser from '../../iam/decorators/active-user.decorator'
import { ActivePlayerData } from '../../iam/types/active-player-data.type'
import CreateMultiplayerRoomDto from './dto/create-multiplayer-room.dto'
import GetScheduledGameDto from './dto/get-scheduled-game.dto'
import ScheduledGamesService from './scheduled-games.service'

@Controller('scheduled-games')
export default class ScheduledGamesController {
	constructor(private readonly roomsService: ScheduledGamesService) {}

	@Post()
	async create(@ActiveUser() activePlayerData: ActivePlayerData, @Body() createRoomDto: CreateMultiplayerRoomDto) {
		return this.roomsService.create(activePlayerData, createRoomDto)
	}

	@Auth(AuthType.None)
	@Get(':gameId')
	async getById(@Param() getScheduledGameDto: GetScheduledGameDto) {
		return this.roomsService.getById(getScheduledGameDto.gameId)
	}
}
