import { Logger, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { CacheModule } from '@nestjs/cache-manager'
import { redisStore } from 'cache-manager-redis-yet'
import type { RedisClientOptions } from 'redis'
import { APP_FILTER } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import WordsModule from './admin/words/words.module'
import LogicModule from './logic/logic.module'
import WebsocketGateway from './websocket/websocket.gateway'
import WebsocketModule from './websocket/websocket.module'
import AppController from './app.controller'
import AppService from './app.service'
import IamModule from './iam/iam.module'
import PrismaModule from './prisma/prisma.module'
import GlobalExceptionFilter from './utils/filters/global-exception.filter'
import MailModule from './mail/mail.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
    ScheduleModule.forRoot(),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          url: config.get('REDIS_URL'),
        }),
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
