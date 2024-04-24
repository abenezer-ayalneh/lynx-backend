import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
import { Logger } from '@nestjs/common'
import WebsocketService from './websocket.service'
import { SocketUserStatusType } from '../commons/types/socket.type'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export default class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection
{
  logger: Logger

  connectedUsers: SocketUserStatusType | undefined = {}

  constructor(private readonly websocketService: WebsocketService) {
    this.logger = new Logger()
  }

  afterInit(server: Server) {
    this.websocketService.socket = server
  }

  async handleConnection(client: Socket<DefaultEventsMap, DefaultEventsMap>) {
    this.logger.verbose(`Connected Device: ${client.id}`)
    this.connectedUsers[client.id] = {
      username: '',
      mute: false,
      online: false,
      microphone: false,
    }

    client.on('voice', (data) => {
      const splitData = data.split(';')
      splitData[0] = 'data:audio/ogg;'
      const newData = splitData[0] + splitData[1]

      // client.broadcast.emit('send-audio', newData)
      Object.entries(this.connectedUsers).forEach(([key, clientStatus]) => {
        if (key !== client.id && !clientStatus?.mute && clientStatus?.online) {
          client.to(key).emit('send-audio', newData)
        }
      })
    })

    // Update the client information by the newly sent data
    client.on('user-information', (data) => {
      this.logger.debug({ data })
      this.connectedUsers[client.id] = data
      this.websocketService.socket.emit('update-users', this.connectedUsers)
    })

    // Remove the client from the client list and emit remove-user event
    client.on('disconnect', () => {
      this.logger.verbose(`Disconnected Device: ${client.id}`)
      this.websocketService.socket.emit(
        'remove-user',
        this.connectedUsers[client.id],
      )
      delete this.connectedUsers[client.id]
    })
  }
}
