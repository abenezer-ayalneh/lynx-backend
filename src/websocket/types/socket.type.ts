export interface SocketUserStatusType {
	[key: string]: UserStatusType
}

export interface UserStatusType {
	username: string
	mute: boolean
	microphone: boolean
	room?: string
}
