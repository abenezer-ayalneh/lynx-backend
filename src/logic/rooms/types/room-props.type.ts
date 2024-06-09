import Word from '../states/word.state'

export type RoomProps = {
  word: Word
  words: Word[]
  guessing?: boolean
  round?: number
  totalRound?: number
  time?: number
  cycle?: number
  numberOfPlayers?: number
  waitingCountdownTime?: number
  gameState: 'START_COUNTDOWN' | 'ROUND_END' | 'GAME_STARTED' | 'GAME_END'
  winner: boolean
  score: number
}

export type RoomCreateProps = {
  gameId: number
  gameType: string
  playerId: number
}
