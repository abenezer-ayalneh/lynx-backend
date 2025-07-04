import { MapSchema, Schema, type } from '@colyseus/schema'

import { LobbyRoomProps } from '../types/lobby-room-props.type'

export default class LobbyRoomState extends Schema {
	@type('number') gameId: number

	@type('string') startTime: string

	@type('number') ownerId: number

	@type({ map: 'string' }) playerNames = new MapSchema<string>()

	constructor({ gameId, startTime, ownerId }: LobbyRoomProps) {
		super()

		this.gameId = gameId
		this.startTime = startTime
		this.ownerId = ownerId
	}
}
