import { IsArray, IsEmail, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator'

export default class SendMailDto {
  @IsEmail(
    {},
    {
      each: true,
      message: 'Each email must be a valid email address.',
    },
  )
  @IsArray({ message: 'Emails must be an array.' })
  @IsOptional({ each: true })
  to: string[]

  @IsEmail({}, { message: 'From address should be a valid email' })
  @IsNotEmpty({ message: 'From address should not be empty' })
  from: string

  @IsString()
  @IsOptional()
  subject: string

  @IsString()
  @IsNotEmpty()
  template: string

  @IsObject({ message: 'Context Should be an object' })
  @IsOptional()
  context: object
}
