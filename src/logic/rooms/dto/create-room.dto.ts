import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator'

export default class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  room_id: string

  @IsBoolean()
  @IsOptional()
  status?: boolean

  @Min(2)
  @Max(8)
  @IsNumber()
  @IsOptional()
  max_players?: number

  @Min(1)
  @Max(30)
  @IsNumber()
  @IsOptional()
  rounds?: number

  @IsString()
  @IsNotEmpty()
  invite_text: string

  @IsEmail(
    {},
    {
      each: true,
      message: 'Each email must be a valid email address.',
    },
  )
  @IsArray({ message: 'Emails must be an array.' })
  emails: string[]
}
