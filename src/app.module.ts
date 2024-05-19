import { Logger, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import WebsocketGateway from './websocket/websocket.gateway'
import WebsocketModule from './websocket/websocket.module'
import AppController from './app.controller'
import AppService from './app.service'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), WebsocketModule],
  controllers: [AppController],
  providers: [AppService, WebsocketGateway, Logger],
})
export default class AppModule {}
