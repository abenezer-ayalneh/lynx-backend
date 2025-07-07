import { IsNotEmpty, IsString } from 'class-validator'

export default class GetScheduledGameDto {
	@IsString()
	@IsNotEmpty()
	gameId: string
}
