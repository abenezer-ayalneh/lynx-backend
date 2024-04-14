import { Module } from '@nestjs/common'
import WebsocketGateway from './websocket/websocket.gateway'
import WebsocketModule from './websocket/websocket.module'
import AppController from './app.controller'
import AppService from './app.service'

@Module({
  imports: [WebsocketModule],
  controllers: [AppController],
  providers: [AppService, WebsocketGateway],
})
export default class AppModule {}
