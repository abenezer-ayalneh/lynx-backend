import { ArraySchema, Schema, type } from '@colyseus/schema'
import { Word as WordModel } from '@prisma/client'

import CueWord from './cue-word.state'

export default class Word extends Schema {
	@type('number') id: number

	@type('string') key: string

	@type([CueWord]) cues = new ArraySchema<CueWord>()

	constructor(word: WordModel) {
		super()

		const cueWords = [
			new CueWord(1, word.cueWord1, true),
			new CueWord(2, word.cueWord2, true),
			new CueWord(3, word.cueWord3, false),
			new CueWord(4, word.cueWord4, false),
			new CueWord(5, word.cueWord5, false),
		]

		this.id = word.id
		this.key = word.key
		this.cues = new ArraySchema<CueWord>(...cueWords)
	}
}
