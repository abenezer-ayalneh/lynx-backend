import { Schema, type } from '@colyseus/schema'
import { LobbyRoomProps } from '../types/lobby-room-props.type'

export default class LobbyRoomState extends Schema {
  @type('number') gameId: number

  @type('string') startTime: string

  @type('number') ownerId: number

  constructor({ gameId, startTime, ownerId }: LobbyRoomProps) {
    super()

    this.gameId = gameId
    this.startTime = startTime
    this.ownerId = ownerId
  }
}
