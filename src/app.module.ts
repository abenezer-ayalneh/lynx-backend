import { Logger, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import WebsocketGateway from './websocket/websocket.gateway'
import WebsocketModule from './websocket/websocket.module'
import AppController from './app.controller'
import AppService from './app.service'
import IamModule from './iam/iam.module'
import PrismaModule from './prisma/prisma.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WebsocketModule,
    IamModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService, WebsocketGateway, Logger],
})
export default class AppModule {}
