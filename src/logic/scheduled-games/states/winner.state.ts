import { Schema, type } from '@colyseus/schema'
import { Winner as WinnerType } from '../types/winner.type'

export default class Winner extends Schema {
  @type('string') id: string

  @type('string') name: string

  @type('number') score: number

  constructor(winner: WinnerType) {
    super()

    this.id = winner.id
    this.name = winner.name
    this.score = winner.score
  }

  incrementScore(score: number) {
    this.score += score
  }
}
