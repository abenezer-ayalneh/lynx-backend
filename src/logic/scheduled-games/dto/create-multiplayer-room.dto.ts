import { ScheduledGameType } from '@prisma/client'
import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator'

import IsInTheFuture from '../../../utils/validators/is-in-the-future/is-in-the-future.decorator'

export default class CreateMultiplayerRoomDto {
	@IsString()
	@IsNotEmpty()
	invitation_text: string

	@IsEmail(
		{},
		{
			each: true,
			message: 'Each email must be a valid email address.',
		},
	)
	@IsArray({ message: 'Emails must be an array.' })
	emails: string[]

	@IsString()
	@IsNotEmpty()
	@IsEnum(ScheduledGameType)
	gameScheduleType: ScheduledGameType

	@IsInTheFuture('timezone')
	@IsString()
	@IsNotEmpty()
	@ValidateIf((thisClass: CreateMultiplayerRoomDto) => thisClass.gameScheduleType === ScheduledGameType.FUTURE)
	start_time?: string

	@IsString()
	@IsNotEmpty()
	@ValidateIf((thisClass: CreateMultiplayerRoomDto) => thisClass.gameScheduleType === ScheduledGameType.FUTURE)
	timezone?: string
}
