import { Transform } from 'class-transformer'
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'

const ToUpperCase = () => Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : (value as unknown)))

export default class CreateWordDto {
	@ToUpperCase()
	@IsString()
	@IsNotEmpty()
	key: string

	@ToUpperCase()
	@IsString()
	@IsNotEmpty()
	cueWord1: string

	@ToUpperCase()
	@IsString()
	@IsNotEmpty()
	cueWord2: string

	@ToUpperCase()
	@IsString()
	@IsNotEmpty()
	cueWord3: string

	@ToUpperCase()
	@IsString()
	@IsNotEmpty()
	cueWord4: string

	@ToUpperCase()
	@IsString()
	@IsNotEmpty()
	cueWord5: string

	@IsBoolean()
	@IsOptional()
	status?: boolean
}
