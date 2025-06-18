import { Injectable, Logger } from '@nestjs/common'
import PrismaService from 'src/prisma/prisma.service'

import { MAX_ROUNDS_PER_GAME_LIMIT } from '../../commons/constants/common.constant'
import CreateGameDto from './dto/create-game.dto'

@Injectable()
export default class GameService {
  logger: Logger

  constructor(private readonly prismaService: PrismaService) {
    this.logger = new Logger('GameService')
  }

  async create(createGameDto: CreateGameDto, playerId: number) {
    // Choose random words(their IDs) from the total
    // const words = await this.getWords(lastWord.id, TOTAL_GAME_ROUNDS)
    const randomWordIds = await this.prismaService.$queryRawUnsafe<{ id: number }[]>(`SELECT id
                                                                                      FROM words
                                                                                      ORDER BY random()
                                                                                      LIMIT ${MAX_ROUNDS_PER_GAME_LIMIT}`)

    // Create a game and connect it with chosen words
    return this.prismaService.game.create({
      data: {
        type: createGameDto.type,
        Owner: {
          connect: { id: playerId },
        },
        Words: {
          connect: randomWordIds,
        },
        ScheduledGame: {
          connect: createGameDto.scheduledGameId ? { id: createGameDto.scheduledGameId } : undefined,
        },
      },
      select: {
        id: true,
        type: true,
        created_at: true,
      },
    })
  }

  findAll() {
    return this.prismaService.game.findMany({
      where: { status: true, deleted_at: null },
      select: {
        id: true,
        type: true,
        created_at: true,
      },
    })
  }

  findOne(id: number) {
    return this.prismaService.game.findUnique({
      where: { id, deleted_at: null },
      select: {
        id: true,
        owner_id: true,
        type: true,
        created_at: true,
      },
    })
  }

  findFirstByScheduledGameId(id: number) {
    return this.prismaService.game.findFirst({
      where: { scheduled_game_id: id },
      orderBy: { created_at: 'desc' },
      include: { Words: true },
    })
  }

  remove(id: number) {
    return this.prismaService.game.update({
      where: { id },
      data: { deleted_at: new Date(), status: false },
    })
  }

  async getWords(total: number, uniqueNumbersQuantity: number): Promise<number[]> {
    if (total < uniqueNumbersQuantity) {
      throw new Error(`Total numbers must be at least ${uniqueNumbersQuantity} to pick ${uniqueNumbersQuantity} unique numbers.`)
    }

    // Helper function to generate a random integer between min and max (inclusive)
    function getRandomInt(min: number, max: number) {
      return Math.floor(Math.random() * (max - min + 1)) + min
    }

    // Set to ensure unique numbers
    const numbers = new Set<number>()

    // Generate unique random numbers
    while (numbers.size < uniqueNumbersQuantity) {
      const randomNumber = getRandomInt(1, total)

      const word = await this.prismaService.word.findUnique({
        where: { id: randomNumber },
      })
      if (word) {
        numbers.add(randomNumber)
      }
    }

    // Convert the set to an array
    return Array.from(numbers)
  }
}
