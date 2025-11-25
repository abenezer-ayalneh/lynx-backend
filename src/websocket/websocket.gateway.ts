import { Logger } from '@nestjs/common'
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'

import { PlayerStatusType, SocketPlayerStatusType } from './types/socket.type'
import WebsocketService from './websocket.service'

@WebSocketGateway({
	cors: {
		origin: '*',
	},
})
export default class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	logger: Logger

	connectedPlayers: SocketPlayerStatusType | undefined = {}

	constructor(private readonly websocketService: WebsocketService) {
		this.logger = new Logger('WebsocketGateway')
	}

	afterInit(server: Server) {
		this.websocketService.socket = server
	}

	handleConnection(client: Socket<DefaultEventsMap, DefaultEventsMap>) {
		this.logger.verbose(`Connected Device: ${client.id}`)
		this.connectedPlayers[client.id] = {
			username: '',
			mute: false,
			microphone: false,
			room: undefined,
		}

		client.on('voice', (data: string) => {
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
		client.on('player-information', async (data: PlayerStatusType) => {
			this.logger.debug({ data })
			this.connectedPlayers[client.id] = data
			await client.join(data.room)

			this.websocketService.socket.to(data.room).emit('update-players', this.returnPlayersInTheRoom(data.room))
		})

		client.on('leave-room', async (room: string) => {
			await client.leave(room)
			this.websocketService.socket.to(room).emit('remove-player', this.returnPlayersInARoomWithPlayerRemoved(client.id))
		})
	}

	handleDisconnect(client: Socket<DefaultEventsMap, DefaultEventsMap>) {
		this.logger.verbose(`Disconnected Device: ${client.id}`)
		if (this.connectedPlayers[client.id]?.room) {
			this.websocketService.socket.to(this.connectedPlayers[client.id].room).emit('remove-player', this.returnPlayersInARoomWithPlayerRemoved(client.id))
		}
		// Clean up the client from the connected players map to prevent memory leaks
		delete this.connectedPlayers[client.id]
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
