import { ArraySchema, Schema, type } from '@colyseus/schema'
import Player from './player.state'

export default class MultiplayerRoomState extends Schema {
  @type([Player]) players = new ArraySchema<Player>()

  @type('boolean') minPlayersSatisfied = false
}
