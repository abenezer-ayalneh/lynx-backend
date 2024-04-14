export interface SocketUserStatusType {
  [key: string]: {
    username: string
    mute: boolean
    microphone: boolean
    online: boolean
  }
}
