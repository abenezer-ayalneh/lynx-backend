import { IsEmail, MinLength } from 'class-validator'

export default class SignInDto {
  @IsEmail()
  email: string

  @MinLength(8)
  password: string
}
