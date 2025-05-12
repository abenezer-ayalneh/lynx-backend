import { Schema, type } from '@colyseus/schema'
import { RestartGameVoteProps } from '../types/restart-game-vote.type'

export default class RestartGameVote extends Schema {
  @type('string') id: string

  @type('boolean') vote: boolean

  constructor(winner: RestartGameVoteProps) {
    super()

    this.id = winner.id
    this.vote = winner.vote
  }

  voteForRestart(vote: boolean) {
    this.vote = vote
  }
}
