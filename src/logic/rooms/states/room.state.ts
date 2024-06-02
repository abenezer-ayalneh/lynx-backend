import { Schema, type } from '@colyseus/schema'
import { FIRST_CYCLE_TIME } from '../../../commons/constants/game-time.constant'
import Word from './word.state'

export default class RoomState extends Schema {
  @type('boolean') guessing: boolean = false

  @type('number') round: number = 1

  @type('number') totalRound: number = 10

  @type('number') time: number = FIRST_CYCLE_TIME

  @type('number') wordCount: number = 1

  @type(Word) word: Word

  @type('number') numberOfPlayers: number = 1

  @type('number') startCountdown: number = 3
}
