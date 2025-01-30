import { Module } from '@nestjs/common'
import { join } from 'path'
import { MailerModule } from '@nestjs-modules/mailer'
import { ConfigService } from '@nestjs/config'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { BullModule } from '@nestjs/bull'
import MailController from './mail.controller'
import MailService from './mail.service'
import MailConsumer from './queue/mail.consumer'
import { MAIL_QUEUE_NAME } from '../commons/constants/common.constant'

@Module({
  imports: [
    BullModule.registerQueueAsync({
      inject: [ConfigService],
      name: MAIL_QUEUE_NAME,
      useFactory: (configService: ConfigService) => ({
        redis: {
          port: configService.get('REDIS_PORT'),
        },
      }),
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: config.get('MAIL_PORT'),
          secure: config.get<boolean>('MAIL_SECURE'),
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: '"No Reply" <lynxman.gamer@gmail.com>',
        },
        template: {
          dir: join(process.env.PWD, 'src', 'mail', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  controllers: [MailController],
  providers: [MailService, MailConsumer],
  exports: [MailService],
})
export default class MailModule {}
