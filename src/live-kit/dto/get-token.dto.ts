import { IsNotEmpty, IsString } from 'class-validator'

export class GetTokenDto {
  @IsString()
  @IsNotEmpty()
  colyseusRoomId: string

  @IsString()
  @IsNotEmpty()
  sessionId: number
}
