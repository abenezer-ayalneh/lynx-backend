import { Injectable } from '@nestjs/common'
import PrismaService from 'src/prisma/prisma.service'
import CreateGameDto from './dto/create-game.dto'

@Injectable()
export default class GameService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createGameDto: CreateGameDto, playerId: number) {
    // Get the number of words to pick from
    const wordsCount = await this.prismaService.word.count({})

    // Choose random words(their IDs) from the total
    const words = this.getWords(wordsCount, 3)

    // Create a game and connect it with chosen words
    return this.prismaService.game.create({
      data: {
        type: createGameDto.type,
        Owner: {
          connect: { id: playerId },
        },
        Words: {
          connect: words.map((word) => ({
            id: word,
          })),
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
        type: true,
        created_at: true,
      },
    })
  }

  remove(id: number) {
    return this.prismaService.game.update({
      where: { id },
      data: { deleted_at: new Date() },
    })
  }

  getWords(total: number, uniqueNumbers: number): number[] {
    if (total < uniqueNumbers) {
      throw new Error(
        `Total numbers must be at least ${uniqueNumbers} to pick ${uniqueNumbers} unique numbers.`,
      )
    }

    // Helper function to generate a random integer between min and max (inclusive)
    function getRandomInt(min: number, max: number) {
      return Math.floor(Math.random() * (max - min + 1)) + min
    }

    // Set to ensure unique numbers
    const numbers = new Set<number>()

    // Generate unique random numbers
    while (numbers.size < uniqueNumbers) {
      numbers.add(getRandomInt(1, total))
    }

    // Convert the set to an array
    return Array.from(numbers)
  }
}
