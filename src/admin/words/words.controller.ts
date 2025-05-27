import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'

import CreateWordDto from './dto/create-word.dto'
import FindAllWordsDto from './dto/find-all-words.dto'
import UpdateWordDto from './dto/update-word.dto'
import WordsService from './words.service'

@Controller('words')
export default class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Post()
  create(@Body() createWordDto: CreateWordDto) {
    return this.wordsService.create(createWordDto)
  }

  @Get()
  findAll(@Query() findAllWordsDto: FindAllWordsDto) {
    return this.wordsService.findAll(findAllWordsDto)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wordsService.findOne(+id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWordDto: UpdateWordDto) {
    return this.wordsService.update(+id, updateWordDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wordsService.remove(+id)
  }
}
