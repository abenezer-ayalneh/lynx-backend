export type MultiplayerRoomCreationProps = {
	gameId: number // The scheduled game's ID
	ownerId: number // The ID of the user who created this game
	startTime: string // The scheduled game's start time
}

export type MultiplayerRoomJoinDto = {
	gameId: string | number
}
