import { NestFactory } from '@nestjs/core'
import { Logger, ValidationPipe } from '@nestjs/common'
import { WinstonModule } from 'nest-winston'
import AppModule from './app.module'
import winstonLoggerInstance from './utils/log/winston.log'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: winstonLoggerInstance }),
  })
  const logger = new Logger()
  app.enableCors({ origin: process.env.CORS_ALLOWED_ORIGIN ?? false })
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  app.setGlobalPrefix('api')

  await app.listen(process.env.APP_PORT || 3000, async () =>
    logger.verbose(`Application running at: ${await app.getUrl()}`),
  )
}

bootstrap()
