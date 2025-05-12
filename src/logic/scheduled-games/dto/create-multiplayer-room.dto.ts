import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator'
import { ScheduledGameType } from '@prisma/client'

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

  @IsString()
  @IsNotEmpty()
  @ValidateIf((thisClass) => thisClass.gameScheduleType === ScheduledGameType.FUTURE)
  start_time: string

  @IsString()
  @IsNotEmpty()
  @ValidateIf((thisClass) => thisClass.gameScheduleType === ScheduledGameType.FUTURE)
  timezone: string
}
