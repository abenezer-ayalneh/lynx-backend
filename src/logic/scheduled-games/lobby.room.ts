import { Room } from 'colyseus'
import { Injectable, Logger } from '@nestjs/common'
import { CreateLobbyDto } from './types/lobby-room-props.type'
import LobbyRoomState from './states/lobby-room.state'

@Injectable()
export default class LobbyRoom extends Room {
  logger: Logger

  constructor() {
    super()
    this.logger = new Logger('LobbyRoom')
    this.autoDispose = false
  }

  /**
   * Initiate a room and subscribe to the guess message type
   */
  onCreate(createLobbyDto: CreateLobbyDto) {
    const lobbyState = new LobbyRoomState(createLobbyDto)

    this.setState(lobbyState)
  }

  /**
   * Triggered when a player successfully joins the room
   */
  // onJoin(client: Client, options: any, auth: { sub: number }) {
  //   this.logger.debug({ client })
  // }

  /**
   *  Triggered when a player leaves the room
   * @param client
   */
  // onLeave(client: Client) {}
}
