import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
import { Logger } from '@nestjs/common'
import WebsocketService from './websocket.service'
import { SocketPlayerStatusType, PlayerStatusType } from './types/socket.type'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export default class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection
{
  logger: Logger

  connectedPlayers: SocketPlayerStatusType | undefined = {}

  constructor(private readonly websocketService: WebsocketService) {
    this.logger = new Logger()
  }

  afterInit(server: Server) {
    this.websocketService.socket = server
  }

  async handleConnection(client: Socket<DefaultEventsMap, DefaultEventsMap>) {
    this.logger.verbose(`Connected Device: ${client.id}`)
    this.connectedPlayers[client.id] = {
      username: '',
      mute: false,
      microphone: false,
      room: undefined,
    }

    client.on('voice', (data) => {
      const splitData = data.split(';')
      splitData[0] = 'data:audio/ogg;'
      const newData = splitData[0] + splitData[1]
      const room = this.connectedPlayers[client.id]?.room

      client.broadcast.in(room).emit('send-audio', newData)
      // client.broadcast.emit('send-audio', newData)
      // Object.entries(this.connectedPlayers).forEach(([key, clientStatus]) => {
      //   if (
      //     key !== client.id &&
      //     !clientStatus?.mute &&
      //     clientStatus.room === this.connectedPlayers[client.id]?.room
      //   ) {
      //     client.to(key).emit('send-audio', newData)
      //   }
      // })
    })

    // Update the client information by the newly sent data
    client.on('player-information', (data: PlayerStatusType) => {
      this.logger.debug({ data })
      this.connectedPlayers[client.id] = data
      client.join(data.room)

      this.websocketService.socket
        .to(data.room)
        .emit('update-players', this.returnPlayersInTheRoom(data.room))
    })

    client.on('leave-room', (room: string) => {
      client.leave(room)
      this.websocketService.socket
        .to(room)
        .emit(
          'remove-player',
          this.returnPlayersInARoomWithPlayerRemoved(client.id),
        )
    })

    // Remove the client from the client list and emit remove-player event
    client.on('disconnect', () => {
      this.logger.verbose(`Disconnected Device: ${client.id}`)
      if (this.connectedPlayers[client.id]?.room) {
        this.websocketService.socket
          .to(this.connectedPlayers[client.id].room)
          .emit(
            'remove-player',
            this.returnPlayersInARoomWithPlayerRemoved(client.id),
          )
      }
      delete this.connectedPlayers[client.id]
    })
  }

  private returnPlayersInTheRoom(room: string) {
    const result = {}

    Object.entries(this.connectedPlayers).forEach(([key, playerStatus]) => {
      if (playerStatus.room === room) {
        result[key] = playerStatus
      }
    })

    return result
  }

  private returnPlayersInARoomWithPlayerRemoved(playerId: string) {
    const result = {}
    const room = this.connectedPlayers[playerId]?.room

    if (room) {
      Object.entries(this.connectedPlayers).forEach(([key, playerStatus]) => {
        if (playerStatus.room === room && key !== playerId) {
          result[key] = playerStatus
        }
      })
    }

    return result
  }
}
