import { Injectable, Logger } from '@nestjs/common'
import { Client, matchMaker, Room } from 'colyseus'

import GameService from '../games/games.service'
import LobbyRoomState from './states/lobby-room.state'
import { LobbyRoomProps } from './types/lobby-room-props.type'

@Injectable()
export default class LobbyRoom extends Room<LobbyRoomState> {
  logger: Logger

  constructor(private readonly gameService: GameService) {
    super()
    this.logger = new Logger('LobbyRoom')
    this.autoDispose = false
  }

  /**
   * Initiate a room and subscribe to the guess message type
   */
  onCreate(createLobbyDto: LobbyRoomProps) {
    const lobbyState = new LobbyRoomState(createLobbyDto)
    this.setState(lobbyState)
    this.registerMessages()
  }

  /**
   * Triggered when a player successfully joins the room
   */
  onJoin(client: Client, options: { player: { name: string } }) {
    this.state.playerNames.set(client.sessionId, options.player.name)
  }

  /**
   *  Triggered when a player leaves the room
   * @param client
   */
  onLeave(client: Client) {
    this.state.playerNames.delete(client.sessionId)
  }

  /**
   * Subscribe to necessary messages
   * @private
   */
  private registerMessages() {
    this.onMessage('startGame', (_, message: { playerId: string }) => {
      this.gameService
        .create({ type: 'MULTIPLAYER', scheduledGameId: this.state.gameId }, Number(message.playerId))
        .then(() => {
          matchMaker
            .createRoom('multiplayer', {
              gameId: this.state.gameId,
              ownerId: this.state.ownerId,
            })
            .then(async (room) => {
              this.broadcast('startGame', {
                roomId: room.roomId,
              })
              await this.disconnect()
            })
            .catch((error) => this.logger.error(error))
        })
        .catch((error) => this.logger.error(error))
    })
  }
}
