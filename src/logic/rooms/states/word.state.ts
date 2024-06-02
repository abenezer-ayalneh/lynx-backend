import { ArraySchema, Schema, type } from '@colyseus/schema'
import { Word as WordModel } from '@prisma/client'
import CueWord from './cue-word.state'

export default class Word extends Schema {
  @type('number') id: number

  @type('string') key: string

  @type([CueWord]) cues = new ArraySchema<CueWord>()

  constructor(word: WordModel) {
    super()

    const cueWords = Object.keys(word)
      .filter((key) => key.startsWith('cue_word_'))
      .map(
        (cue, index) =>
          new CueWord(index + 1, word[cue].replace(word.key, ''), index < 3),
      )

    this.id = word.id
    this.key = word.key
    this.cues = new ArraySchema<CueWord>(...cueWords)
  }
}
