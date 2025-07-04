import { IsNotEmpty, IsString } from 'class-validator'

export default class RsvpDto {
	@IsNotEmpty()
	gameId: string

	@IsString()
	@IsNotEmpty()
	email: string
}
