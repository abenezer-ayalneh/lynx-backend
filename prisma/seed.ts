import { Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const logger = new Logger('PrismaSeed')

async function main() {
	// Playing words
	const words = [
		{
			key: 'ABBEY',
			cue_word_1: 'WESTMINSTER ABBEY',
			cue_word_2: 'EDWARD ABBEY',
			cue_word_3: 'ABBEY ROAD',
			cue_word_4: 'DOWNTON ABBEY',
			cue_word_5: 'ABBEY LEE',
		},
		{
			key: 'ABLE',
			cue_word_1: 'HONORABLE',
			cue_word_2: 'ABLE-BODIED',
			cue_word_3: 'CAPABLE ',
			cue_word_4: 'WILLING & ABLE',
			cue_word_5: 'PREFERABLE  ',
		},
		{
			key: 'ACHE',
			cue_word_1: 'BACKACHE',
			cue_word_2: 'MUSTACHE',
			cue_word_3: 'TUMMYACHE',
			cue_word_4: 'EARACHE',
			cue_word_5: 'HEARTACHE',
		},
		{
			key: 'ACTION-PACKED',
			cue_word_1: 'LEGAL ACTION',
			cue_word_2: 'EVASIVE ACTION',
			cue_word_3: 'CLASS ACTION',
			cue_word_4: 'AFFIRMATIVE ACTION',
			cue_word_5: 'ACTION PLAN',
		},
		{
			key: 'AIR',
			cue_word_1: 'AIR JORDAN',
			cue_word_2: 'AIR GUITAR',
			cue_word_3: 'AIR POLLUTION',
			cue_word_4: 'AIR FORCE ONE',
			cue_word_5: 'AIR CONDITIONER',
		},
	]
	await prisma.word.createMany({ data: words })

	// Players
	const players = [
		{
			name: 'John Doe',
			email: 'johndoe@email.com',
			password: '$2b$10$Lehm1aJ1djPYMCm.0CmvaO/vq5cgXdWUYGkOcXjdJdYmahdFFbRjK', // passpass
		},
	]
	await prisma.player.createMany({ data: players })

	// I use this to make the ID sequence start from the last seeded data ID
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
