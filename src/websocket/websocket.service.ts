import { Injectable } from '@nestjs/common'
import { Server } from 'socket.io'

@Injectable()
export default class WebsocketService {
  public socket: Server = null
}
