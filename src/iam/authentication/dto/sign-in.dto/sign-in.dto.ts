import { IsEmail, IsNotEmpty, MinLength } from 'class-validator'

export default class SignInDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @MinLength(8)
  @IsNotEmpty()
  password: string
}
