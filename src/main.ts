import { NestFactory } from '@nestjs/core'
import { Logger, ValidationPipe } from '@nestjs/common'
import AppModule from './app.module'

async function bootstrap() {
  const logger = new Logger()
  const app = await NestFactory.create(AppModule)
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
