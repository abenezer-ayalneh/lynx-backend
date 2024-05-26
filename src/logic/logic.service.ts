import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common'
import * as http from 'http'

import { Room, Server } from 'colyseus'

type Type<T> = new (...args: any[]) => T

@Injectable()
export default class LogicService implements OnApplicationShutdown {
  server: Server = null

  logger: Logger

  constructor() {
    this.logger = new Logger()
  }

  createServer(httpServer: http.Server) {
    if (this.server) return

    this.server = new Server({ server: httpServer })
  }

  defineRoom(name: string, room: Type<Room<any, any>>) {
    this.server.define(name, room)
  }

  listen(port: number) {
    if (this.server) {
      this.server.listen(port)
    }
  }

  onApplicationShutdown(sig) {
    if (!this.server) return
    this.logger.verbose(
      `Caught signal ${sig}. Game service shutting down on ${new Date()}.`,
    )
    this.server.gracefullyShutdown()
  }
}
