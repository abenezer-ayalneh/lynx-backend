import { Logger, ValidationError, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { WinstonModule } from 'nest-winston'
import AppModule from './app.module'
import ValidationException from './utils/exceptions/validation.exception'
import GlobalExceptionFilter from './utils/filters/global-exception.filter'
import winstonLoggerInstance from './utils/log/winston.log'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: winstonLoggerInstance }),
  })
  const logger = new Logger()
  app.enableCors({ origin: process.env.CORS_ALLOWED_ORIGIN ?? false })
  app.useGlobalFilters(new GlobalExceptionFilter(logger))
  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new ValidationException(validationErrors)
      },
    }),
  )

  await app.listen(process.env.APP_PORT || 3000, async () =>
    logger.verbose(`Application running at: ${await app.getUrl()}`),
  )
}

bootstrap()
