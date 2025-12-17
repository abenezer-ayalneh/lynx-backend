import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export default class CreateWordDto {
	@IsString()
	@IsNotEmpty()
	key: string

	@IsString()
	@IsNotEmpty()
	cueWord1: string

	@IsString()
	@IsNotEmpty()
	cueWord2: string

	@IsString()
	@IsNotEmpty()
	cueWord3: string

	@IsString()
	@IsNotEmpty()
	cueWord4: string

	@IsString()
	@IsNotEmpty()
	cueWord5: string

	@IsBoolean()
	@IsOptional()
	status?: boolean
}
