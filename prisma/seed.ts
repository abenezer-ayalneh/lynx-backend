import { PrismaClient } from '@prisma/client'
import { Logger } from '@nestjs/common'

const prisma = new PrismaClient()
const logger = new Logger('PrismaSeed')

async function main() {
  // Playing words
  const words = [
    {
      cue: 'ABBEY',
      word_1: 'WESTMINSTER ABBEY',
      word_2: 'EDWARD ABBEY',
      word_3: 'ABBEY ROAD',
      word_4: 'DOWNTON ABBEY',
      word_5: 'ABBEY LEE',
    },
    {
      cue: 'ABLE',
      word_1: 'HONORABLE',
      word_2: 'ABLE-BODIED',
      word_3: 'CAPABLE ',
      word_4: 'WILLING & ABLE',
      word_5: 'PREFERABLE  ',
    },
    {
      cue: 'ACHE',
      word_1: 'BACKACHE',
      word_2: 'MUSTACHE',
      word_3: 'TUMMYACHE',
      word_4: 'EARACHE',
      word_5: 'HEARTACHE',
    },
    {
      cue: 'ACTION-PACKED',
      word_1: 'LEGAL ACTION',
      word_2: 'EVASIVE ACTION',
      word_3: 'CLASS ACTION',
      word_4: 'AFFIRMATIVE ACTION',
      word_5: 'ACTION PLAN',
    },
    {
      cue: 'AIR',
      word_1: 'AIR JORDAN',
      word_2: 'AIR GUITAR',
      word_3: 'AIR POLLUTION',
      word_4: 'AIR FORCE ONE',
      word_5: 'AIR CONDITIONER',
    },
  ]
  await prisma.word.createMany({ data: words })

  // Players
  const players = [
    {
      name: 'John Doe',
      email: 'john.doe@gmail.com',
      password:
        '$argon2id$v=19$m=65536,t=3,p=4$7OnlZ9aczsCtQmYPI0yi4w$BAMyy+V1yQEAPCXCbmpLYIv9Ny+4H9Y0AnJVj4mw8wA',
    },
  ]
  await prisma.player.createMany({ data: players })

  const sequenceInitializer: Record<string, number> = {
    words: words.length,
    players: players.length,
  }

  Object.entries(sequenceInitializer).forEach(([key, value]) => {
    prisma.$queryRawUnsafe(`
      ALTER SEQUENCE "public"."${key}_id_seq" RESTART WITH ${value};
    `)
  })
}

main()
  .catch(async (e) => {
    logger.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
