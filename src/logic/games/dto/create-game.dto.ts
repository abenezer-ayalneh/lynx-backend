import { GameType } from '@prisma/client'
import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator'

export default class CreateGameDto {
  @IsEnum(GameType)
  @IsNotEmpty()
  type: GameType

  @IsNumber()
  @IsOptional()
  room_id?: number
}
