import { GameType } from '@prisma/client'
import { IsEnum, IsNotEmpty } from 'class-validator'

export default class CreateGameDto {
  @IsEnum(GameType)
  @IsNotEmpty()
  type: GameType
}
