import { createKeyv, RedisClientOptions } from '@keyv/redis'
import { CacheModule } from '@nestjs/cache-manager'
import { Logger, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'

import WordsModule from './admin/words/words.module'
import AppController from './app.controller'
import AppService from './app.service'
import IamModule from './iam/iam.module'
import LogicModule from './logic/logic.module'
import MailModule from './mail/mail.module'
import PrismaModule from './prisma/prisma.module'
import GlobalExceptionFilter from './utils/filters/global-exception.filter'
import WebsocketGateway from './websocket/websocket.gateway'
import WebsocketModule from './websocket/websocket.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
    ScheduleModule.forRoot(),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        stores: [createKeyv(config.get<string>('REDIS_URL'))],
      }),
    }),
    WebsocketModule,
    IamModule,
    PrismaModule,
    LogicModule,
    MailModule,
    WordsModule,
  ],
  controllers: [AppController],
  providers: [
    Logger,
    AppService,
    WebsocketGateway,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter }, // Register the global exception filter in the app level (i.e. globally)
  ],
})
export default class AppModule {}
