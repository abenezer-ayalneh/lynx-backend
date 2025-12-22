import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export default class SignUpDto {
	@MinLength(3)
	@IsString()
	name: string

	@IsEmail()
	email: string

	@MinLength(8)
	password: string

	@MinLength(8)
	confirmPassword: string

	@IsString()
	@IsOptional()
	callbackURL?: string
}
