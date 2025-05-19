import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export default class CreateWordDto {
  @IsString()
  @IsNotEmpty()
  key: string

  @IsString()
  @IsNotEmpty()
  cue_word_1: string

  @IsString()
  @IsNotEmpty()
  cue_word_2: string

  @IsString()
  @IsNotEmpty()
  cue_word_3: string

  @IsString()
  @IsNotEmpty()
  cue_word_4: string

  @IsString()
  @IsNotEmpty()
  cue_word_5: string

  @IsBoolean()
  @IsOptional()
  status?: boolean
}
