import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common'
import { Server } from 'colyseus'

@Injectable()
export default class LogicService implements OnApplicationShutdown {
  server: Server = null

  logger: Logger

  constructor() {
    this.logger = new Logger('LogicService')
  }

  async onApplicationShutdown(sig) {
    if (!this.server) return
    this.logger.warn(`Caught signal ${sig}. Game service shutting down on ${new Date().toUTCString()}.`)
    await this.server.gracefullyShutdown()
  }
}
