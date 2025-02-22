import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema'
import Player from './player.state'
import Word from './word.state'
import { MultiplayerRoomProps } from '../types/multiplayer-room-props.type'

export default class MultiplayerRoomState extends Schema {
  @type('number') gameId: number // The scheduled game's ID

  @type([Player]) players = new ArraySchema<Player>() // Players currently available in the game room

  @type('boolean') guessing: boolean // The guessing state of the game (i.e. if a player has clicked on the 'guess' button or not)

  @type('number') round: number // Currently being played round

  @type('number') totalRound: number // Total number of rounds

  @type('number') time: number // The countdown time currently being displayed

  @type('number') cycle: number // The current word's cycle (i.e. how many cue words are displayed after the initial 3)

  @type(Word) word: Word | undefined // The word row that is currently being played

  @type('number') waitingCountdownTime: number // Countdown timer for the waiting windows

  @type('string')
  gameState: 'START_COUNTDOWN' | 'ROUND_END' | 'GAME_STARTED' | 'GAME_END' // The state the game is currently in

  @type('string') winner: string | null // The player ID of the winner player for the game

  @type({ map: 'number' }) score = new MapSchema<number>() // Scores of the players (key is ID and value is score)

  @type({ map: 'number' }) totalScore = new MapSchema<number>() // Total scores of the players (key is ID and value is total score)

  @type('boolean') gameStarted: boolean // Indicator for game start state

  words: Word[] // All the words selected for this game

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
    gameStarted,
    gameId,
  }: MultiplayerRoomProps) {
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
    this.gameStarted = gameStarted
    this.gameId = gameId
  }
}
