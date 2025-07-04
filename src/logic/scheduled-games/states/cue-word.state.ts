import { Schema, type } from '@colyseus/schema'

export default class CueWord extends Schema {
	@type('number') id: number

	@type('string') word: string

	@type('boolean') shown: boolean

	constructor(id: number, word: string, shown: boolean) {
		super()

		this.id = id
		this.word = word
		this.shown = shown
	}
}
