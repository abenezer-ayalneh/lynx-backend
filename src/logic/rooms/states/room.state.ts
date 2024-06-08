import { Schema, type } from '@colyseus/schema'
import Word from './word.state'
import { RoomProps } from '../types/room-props.type'

export default class RoomState extends Schema {
  @type('boolean') guessing: boolean

  @type('number') round: number

  @type('number') totalRound: number

  @type('number') time: number

  @type('number') cycle: number

  @type(Word) word: Word | undefined

  @type('number') numberOfPlayers: number

  @type('number') waitingCountdownTime: number

  @type('string')
  gameState: 'START_COUNTDOWN' | 'ROUND_END' | 'GAME_STARTED' | 'GAME_END'

  words: Word[]

  constructor({
    word,
    guessing,
    round,
    totalRound,
    time,
    cycle,
    numberOfPlayers,
    waitingCountdownTime,
    words,
    gameState,
  }: RoomProps) {
    super()
    this.guessing = guessing
    this.round = round
    this.totalRound = totalRound
    this.time = time
    this.cycle = cycle
    this.word = word
    this.numberOfPlayers = numberOfPlayers
    this.waitingCountdownTime = waitingCountdownTime
    this.words = words
    this.gameState = gameState
  }
}
