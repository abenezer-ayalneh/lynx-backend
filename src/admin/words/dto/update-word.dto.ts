import { PartialType } from '@nestjs/mapped-types'
import CreateWordDto from './create-word.dto'

export default class UpdateWordDto extends PartialType(CreateWordDto) {}
