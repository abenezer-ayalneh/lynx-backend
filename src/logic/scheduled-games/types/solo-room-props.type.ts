import Word from '../states/word.state'
import Winner from '../states/winner.state'

export type RoomProps = {
  word: Word
  words: Word[]
  guessing?: boolean
  round?: number
  totalRound?: number
  time?: number
  cycle?: number
  waitingCountdownTime?: number
  gameState: 'START_COUNTDOWN' | 'ROUND_END' | 'GAME_STARTED' | 'GAME_END'
  winner?: Winner | null
  score: number
  totalScore: number
}

export type RoomCreateProps = {
  gameId?: number
  gameType?: string
  playerId?: number
}
