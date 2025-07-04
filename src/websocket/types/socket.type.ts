export interface SocketPlayerStatusType {
	[key: string]: PlayerStatusType
}

export interface PlayerStatusType {
	username: string
	mute: boolean
	microphone: boolean
	room?: string
}
