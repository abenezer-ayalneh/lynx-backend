import { Schema, type } from '@colyseus/schema'
import Word from './word.state'
import { RoomProps } from '../types/solo-room-props.type'

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

  @type('boolean') winner: boolean

  @type('number') score: number

  @type('number') totalScore: number

  words: Word[]

  constructor({
    word,
    guessing,
    round,
    totalRound,
    time,
    cycle,
    waitingCountdownTime,
    words,
    gameState,
    winner,
    score,
    totalScore,
  }: RoomProps) {
    super()
    this.guessing = guessing
    this.round = round
    this.totalRound = totalRound
    this.time = time
    this.cycle = cycle
    this.word = word
    this.waitingCountdownTime = waitingCountdownTime
    this.words = words
    this.gameState = gameState
    this.winner = winner
    this.score = score
    this.totalScore = totalScore
  }
}
