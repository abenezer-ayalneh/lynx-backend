import { Injectable, Logger } from '@nestjs/common'
import CreateWordDto from './dto/create-word.dto'
import UpdateWordDto from './dto/update-word.dto'
import PrismaService from '../../prisma/prisma.service'
import FindAllWordsDto from './dto/find-all-words.dto'
import WORDS_PER_INFINITY_LOAD from './constants/words.constants'

@Injectable()
export default class WordsService {
  logger = new Logger('WordsService')

  constructor(private readonly prismaService: PrismaService) {}

  create(createWordDto: CreateWordDto) {
    return this.prismaService.word.create({ data: createWordDto })
  }

  findAll(findAllWordsDto: FindAllWordsDto) {
    // let orderBy: Record<string, 'asc' | 'desc'>[] = [{ id: 'desc' }]
    //
    // if (findAllWordsDto.sort) {
    //   const tempOrderBy: Record<string, 'asc' | 'desc'>[] = []
    //   findAllWordsDto.sort.split(',').forEach((sortString) => {
    //     const [key, order] = sortString.split(':')
    //     tempOrderBy.push({ [key]: order as 'asc' | 'desc' })
    //   })
    //
    //   orderBy = tempOrderBy
    // }

    return this.prismaService.word.findMany({
      take: WORDS_PER_INFINITY_LOAD,
      skip: findAllWordsDto.lastWordId ? 1 : undefined,
      cursor: findAllWordsDto.lastWordId ? { id: findAllWordsDto.lastWordId } : undefined,
      where: findAllWordsDto.searchQuery
        ? {
            OR: [{ key: { contains: findAllWordsDto.searchQuery, mode: 'insensitive' } }],
          }
        : undefined,
    })
  }

  findOne(id: number) {
    return this.prismaService.word.findUnique({ where: { id } })
  }

  update(id: number, updateWordDto: UpdateWordDto) {
    return this.prismaService.word.update({ where: { id }, data: updateWordDto })
  }

  remove(id: number) {
    return this.prismaService.word.delete({ where: { id } })
  }
}
