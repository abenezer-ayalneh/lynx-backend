import { IsArray, IsEmail, IsNotEmpty, IsString } from 'class-validator'

export default class CreateRoomDto {
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
  start_time: string

  @IsString()
  @IsNotEmpty()
  timezone: string
}
