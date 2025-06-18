import { IsNotEmpty, IsString } from 'class-validator'

export class GetTokenDto {
  @IsString()
  @IsNotEmpty()
  gameId: string

  @IsString()
  @IsNotEmpty()
  sessionId: string
}
