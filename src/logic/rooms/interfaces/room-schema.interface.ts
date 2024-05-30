export default interface RoomSchemaInterface {
  guessing: boolean
  round: number
  time: number
  wordCount: number
  words: string[]
  numberOfPlayers: number
}
