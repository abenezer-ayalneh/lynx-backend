import { GameType } from '@prisma/client'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export default class CreateGameDto {
	@IsEnum(GameType)
	@IsNotEmpty()
	type: GameType

	@IsString()
	@IsOptional()
	scheduledGameId?: string
}
