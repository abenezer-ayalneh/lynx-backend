import { Schema, type } from '@colyseus/schema'
import { Score as ScoreType } from '../types/winner.type'

export default class Score extends Schema {
  @type('string') id: string

  @type('string') name: string

  @type('number') score: number

  @type('boolean') vote: boolean

  constructor(score: ScoreType) {
    super()

    this.id = score.id
    this.name = score.name
    this.score = score.score
  }

  incrementScore(score: number) {
    this.score += score
  }

  voteForRestart(vote: boolean) {
    this.vote = vote
  }
}
