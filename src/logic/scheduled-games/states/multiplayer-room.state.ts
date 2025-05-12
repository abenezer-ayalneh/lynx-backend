import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema'
import Player from './player.state'
import Word from './word.state'
import { MultiplayerRoomProps } from '../types/multiplayer-room-props.type'
import Winner from './winner.state'
import { Winner as WinnerType } from '../types/winner.type'
import RestartGameVote from './restart-game-vote.state'

export default class MultiplayerRoomState extends Schema {
  @type('number') gameId: number // The scheduled game's ID

  @type('number') ownerId: number // The ID of the player who created this game

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

  @type(Winner) winner: Winner | null // The winner

  @type({ map: 'number' }) score = new MapSchema<number>() // Scores of the players (key is ID and value is score)

  @type({ map: Winner }) totalScore = new MapSchema<Winner>() // Total scores of the players (key is player session ID, and value is total score)

  @type({ map: Winner }) sessionScore = new MapSchema<Winner>() // Total score summation of the players within one game session (key is player session ID, and value is total score)

  @type('boolean') gameStarted: boolean // Indicator for game start state

  @type({ map: RestartGameVote }) restartGameVote = new MapSchema<RestartGameVote>() // Vote state for game restart

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
    gameStarted,
    gameId,
    ownerId,
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
    this.winner = winner ?? null
    this.gameStarted = gameStarted
    this.gameId = gameId
    this.ownerId = ownerId
  }

  /**
   * Sets the winner of the game by creating a new Winner instance with the provided winner data.
   *
   * @param {WinnerType} winner - The data representing the winner.
   * @return {void} No return value.
   */
  setWinner(winner: WinnerType): void {
    this.winner = new Winner(winner)
  }

  /**
   * Resets all the scores in the score map to zero.
   *
   * @return {void} Does not return a value.
   */
  clearScore(): void {
    this.score.forEach((_, key) => {
      this.score.set(key, 0)
    })
  }

  /**
   * Resets the total score of all winners by setting their score to 0.
   *
   * @return {void} Does not return a value.
   */
  clearTotalScore(): void {
    this.totalScore.forEach((winner, key) => {
      this.totalScore.set(key, new Winner({ ...winner, score: 0 }))
    })
  }

  /**
   * Records a player's vote for restarting the game.
   *
   * @param sessionId
   * @param {boolean} vote - A boolean indicating the player's vote.
   *                         Pass `true` to vote for a restart, or `false` against it.
   * @return {void} - Does not return a value.
   */
  voteForGameRestart(sessionId: string, vote: boolean): void {
    this.restartGameVote.set(sessionId, new RestartGameVote({ id: sessionId, vote }))
  }
}
