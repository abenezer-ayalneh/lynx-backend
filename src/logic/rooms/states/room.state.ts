import { ArraySchema, Schema, type } from '@colyseus/schema'

export default class RoomState extends Schema {
  @type('boolean') guessing: boolean = false

  @type('number') round: number = 1

  @type('number') totalRound: number = 10

  @type('number') time: number = 30

  @type('number') wordCount: number = 1

  @type(['string']) words = new ArraySchema<string>()

  @type('number') numberOfPlayers: number = 1

  // constructor({
  //   guessing,
  //   round,
  //   time,
  //   wordCount,
  //   words,
  //   numberOfPlayers,
  // }: RoomSchemaInterface) {
  //   super()
  //
  //   this.guessing = guessing
  //   this.round = round
  //   this.time = time
  //   this.wordCount = wordCount
  //   this.words = new ArraySchema<string>()
  //   this.numberOfPlayers = numberOfPlayers
  // }
}
