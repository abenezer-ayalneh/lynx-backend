import Word from '../states/word.state'

export type RoomProps = {
  word: Word
  words: Word[]
  guessing?: boolean
  round?: number
  totalRound?: number
  time?: number
  wordCount?: number
  numberOfPlayers?: number
  startCountdown?: number
}

export type RoomCreateProps = {
  gameId: number
  gameType: string
  playerId: number
}
