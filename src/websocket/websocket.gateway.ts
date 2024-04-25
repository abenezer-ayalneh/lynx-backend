import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
import { Logger } from '@nestjs/common'
import WebsocketService from './websocket.service'
import { SocketUserStatusType, UserStatusType } from './types/socket.type'

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
      microphone: false,
      room: undefined,
    }

    client.on('voice', (data) => {
      const splitData = data.split(';')
      splitData[0] = 'data:audio/ogg;'
      const newData = splitData[0] + splitData[1]
      const room = this.connectedUsers[client.id]?.room

      client.broadcast.in(room).emit('send-audio', newData)
      // client.broadcast.emit('send-audio', newData)
      // Object.entries(this.connectedUsers).forEach(([key, clientStatus]) => {
      //   if (
      //     key !== client.id &&
      //     !clientStatus?.mute &&
      //     clientStatus.room === this.connectedUsers[client.id]?.room
      //   ) {
      //     client.to(key).emit('send-audio', newData)
      //   }
      // })
    })

    // Update the client information by the newly sent data
    client.on('user-information', (data: UserStatusType) => {
      this.logger.debug({ data })
      this.connectedUsers[client.id] = data
      client.join(data.room)

      this.websocketService.socket
        .to(data.room)
        .emit('update-users', this.returnUsersInTheRoom(data.room))
    })

    client.on('leave-room', (room: string) => {
      client.leave(room)
      this.websocketService.socket
        .to(room)
        .emit('remove-user', this.returnUsersInARoomWithUserRemoved(client.id))
    })

    // Remove the client from the client list and emit remove-user event
    client.on('disconnect', () => {
      this.logger.verbose(`Disconnected Device: ${client.id}`)
      if (this.connectedUsers[client.id]?.room) {
        this.websocketService.socket
          .to(this.connectedUsers[client.id].room)
          .emit(
            'remove-user',
            this.returnUsersInARoomWithUserRemoved(client.id),
          )
      }
      delete this.connectedUsers[client.id]
    })
  }

  private returnUsersInTheRoom(room: string) {
    const result = {}

    Object.entries(this.connectedUsers).forEach(([key, userStatus]) => {
      if (userStatus.room === room) {
        result[key] = userStatus
      }
    })

    return result
  }

  private returnUsersInARoomWithUserRemoved(userId: string) {
    const result = {}
    const room = this.connectedUsers[userId]?.room

    if (room) {
      Object.entries(this.connectedUsers).forEach(([key, userStatus]) => {
        if (userStatus.room === room && key !== userId) {
          result[key] = userStatus
        }
      })
    }

    return result
  }
}
