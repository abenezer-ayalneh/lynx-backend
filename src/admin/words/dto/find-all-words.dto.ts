import { Type } from 'class-transformer'
import { IsNumber, IsOptional, IsString } from 'class-validator'

export default class FindAllWordsDto {
	@IsNumber()
	@Type(() => Number)
	@IsOptional()
	lastWordId?: number

	@IsString()
	@IsOptional()
	searchQuery?: string

	@IsString()
	@IsOptional()
	sort?: string
}
