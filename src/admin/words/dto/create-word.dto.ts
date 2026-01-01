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
	cue_word_1: string

	@ToUpperCase()
	@IsString()
	@IsNotEmpty()
	cue_word_2: string

	@ToUpperCase()
	@IsString()
	@IsNotEmpty()
	cue_word_3: string

	@ToUpperCase()
	@IsString()
	@IsNotEmpty()
	cue_word_4: string

	@ToUpperCase()
	@IsString()
	@IsNotEmpty()
	cue_word_5: string

	@IsBoolean()
	@IsOptional()
	status?: boolean
}
