import { Schema, type } from '@colyseus/schema'
import { LobbyRoomProps } from '../types/lobby-room-props.type'

export default class LobbyRoomState extends Schema {
  @type('number') gameId: number

  @type('string') startTime: string

  constructor({ gameId, startTime }: LobbyRoomProps) {
    super()

    this.gameId = gameId
    this.startTime = startTime
  }
}
