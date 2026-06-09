import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { AllowAnonymous, Session, UserSession } from '@thallesp/nestjs-better-auth'

import CreateMultiplayerRoomDto from './dto/create-multiplayer-room.dto'
import GetScheduledGameDto from './dto/get-scheduled-game.dto'
import ScheduledGamesService from './scheduled-games.service'

@Controller('scheduled-games')
export default class ScheduledGamesController {
	constructor(private readonly roomsService: ScheduledGamesService) {}

	@Post()
	async create(@Session() session: UserSession, @Body() createRoomDto: CreateMultiplayerRoomDto) {
		return this.roomsService.create(session, createRoomDto)
	}

	@AllowAnonymous()
	@Get(':gameId')
	async getById(@Param() getScheduledGameDto: GetScheduledGameDto) {
		return this.roomsService.getById(getScheduledGameDto.gameId)
	}
}
