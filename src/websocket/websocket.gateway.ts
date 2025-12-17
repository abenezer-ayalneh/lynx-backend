import { Logger } from '@nestjs/common'
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'

import { SocketUserStatusType, UserStatusType } from './types/socket.type'
import WebsocketService from './websocket.service'

@WebSocketGateway({
	cors: {
		origin: '*',
	},
})
export default class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	logger: Logger

	connectedUsers: SocketUserStatusType | undefined = {}

	constructor(private readonly websocketService: WebsocketService) {
		this.logger = new Logger('WebsocketGateway')
	}

	afterInit(server: Server) {
		this.websocketService.socket = server
	}

	handleConnection(client: Socket<DefaultEventsMap, DefaultEventsMap>) {
		this.logger.verbose(`Connected Device: ${client.id}`)
		this.connectedUsers[client.id] = {
			username: '',
			mute: false,
			microphone: false,
			room: undefined,
		}

		client.on('voice', (data: string) => {
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

		// Update the client information with the newly sent data
		client.on('user-information', async (data: UserStatusType) => {
			this.logger.debug({ data })
			this.connectedUsers[client.id] = data
			await client.join(data.room)

			this.websocketService.socket.to(data.room).emit('update-users', this.returnUsersInTheRoom(data.room))
		})

		client.on('leave-room', async (room: string) => {
			await client.leave(room)
			this.websocketService.socket.to(room).emit('remove-user', this.returnUsersInARoomWithUserRemoved(client.id))
		})
	}

	handleDisconnect(client: Socket<DefaultEventsMap, DefaultEventsMap>) {
		this.logger.verbose(`Disconnected Device: ${client.id}`)
		if (this.connectedUsers[client.id]?.room) {
			this.websocketService.socket.to(this.connectedUsers[client.id].room).emit('remove-user', this.returnUsersInARoomWithUserRemoved(client.id))
		}
		// Clean up the client from the connected users map to prevent memory leaks
		delete this.connectedUsers[client.id]
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
