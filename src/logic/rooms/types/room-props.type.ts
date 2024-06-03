import Word from '../states/word.state'

export type RoomPropsType = {
  word: Word
  guessing?: boolean
  round?: number
  totalRound?: number
  time?: number
  wordCount?: number
  numberOfPlayers?: number
  startCountdown?: number
}
