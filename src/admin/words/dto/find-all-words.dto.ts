import { IsNumber, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'

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
