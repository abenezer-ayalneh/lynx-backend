import { Delayed, Room } from 'colyseus'
import { Logger } from '@nestjs/common'
import RoomState from './states/room.state'

export default class SoloRoom extends Room<RoomState> {
  logger: Logger

  public delayedInterval: Delayed

  constructor() {
    super()
    this.logger = new Logger('LogicRoom')
  }

  // (optional) Validate client auth token before joining/creating the room
  // static async onAuth(token: string, request: IncomingMessage) {}

  // When room is initialized
  onCreate() {
    const roomState = new RoomState()
    this.setState(roomState)

    this.delayedInterval = this.clock.setInterval(() => {
      this.state.time = roomState.time - 1
      // this.logger.debug(`Time now ${this.clock.currentTime}`)
    }, 1000)

    // After 10 seconds clear the timeout;
    // this will *stop and destroy* the timeout completely
    this.clock.setTimeout(() => {
      this.delayedInterval.clear()
    }, 10000)
  }

  //
  // // When client successfully join the room
  // onJoin(client: Client, options: any, auth: any) {}
  //
  // // When a client leaves the room
  // onLeave(client: Client, consented: boolean) {
  //   this.delayedInterval.clear()
  // }
  //
  // // Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
  // onDispose() {
  //   this.delayedInterval.clear()
  // }
}
