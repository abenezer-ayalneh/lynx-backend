import { MapSchema } from '@colyseus/schema'
import Word from '../states/word.state'

export type MultiplayerRoomProps = {
  word: Word // The word row that is currently being played
  words: Word[] // All the words selected for this game
  guessing?: boolean // The guessing state of the game (i.e. if a player has clicked on the 'guess' button or not)
  round?: number // Currently being played round
  totalRound?: number // Total number of rounds
  time?: number // The countdown time currently being displayed
  cycle?: number // The current word's cycle (i.e. how many cue words are displayed after the initial 3)
  waitingCountdownTime?: number // Countdown timer for the waiting windows
  gameState: 'START_COUNTDOWN' | 'ROUND_END' | 'GAME_STARTED' | 'GAME_END' // The state the game is currently in
  winner?: string // The player ID of the winner player for the game
  score?: MapSchema<number> // Scores of the players (key is ID and value is score)
  gameStarted?: boolean // Indicator for game start state
  gameId: number // The scheduled game's ID
}

export type MultiplayerRoomCreateProps = {
  gameId: number
}
