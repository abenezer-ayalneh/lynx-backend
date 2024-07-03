import {
  INestApplication,
  Logger,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { WinstonModule } from 'nest-winston'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { Room, Server } from 'colyseus'
import { ConfigService } from '@nestjs/config'
import { playground } from '@colyseus/playground'
import AppModule from './app.module'
import ValidationException from './utils/exceptions/validation.exception'
import winstonLoggerInstance from './utils/log/winston.log'
import SoloRoom from './logic/rooms/solo.room'
import MultiplayerRoom from './logic/rooms/multiplayer.room'

function injectDeps<T extends { new (...args: any[]): Room }>(
  app: INestApplication,
  target: T,
): T {
  const selfDeps = Reflect.getMetadata('self:paramtypes', target) || []
  const dependencies = Reflect.getMetadata('design:paramtypes', target) || []

  selfDeps.forEach((dep: any) => {
    dependencies[dep.index] = dep.param
  })

  const injectables =
    dependencies.map((dependency: any) => {
      return app.get(dependency)
    }) || []

  return class extends target {
    constructor(...args: any[]) {
      super(...injectables, args)
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: winstonLoggerInstance }),
  })

  // Colyseus playground
  app.use('/', playground)

  // Config service to access .env file
  const configService = app.get(ConfigService)

  // Logger to log stuff into console
  const logger = new Logger()

  // Enable CORS from allowed origins listed in .env
  app.enableCors({
    origin: configService.get('CORS_ALLOWED_ORIGINS')
      ? configService.get('CORS_ALLOWED_ORIGINS').split(',')
      : false,
  })

  // Add an 'api' prefix to all controller routes
  app.setGlobalPrefix('api')

  // Register global pipes
  app.useGlobalPipes(
    // Register a validation pipe for 'class-validator' to work
    new ValidationPipe({
      whitelist: true, // Don't accept non-listed attributes
      transform: true, // Allow transformation
      forbidNonWhitelisted: true, // Throw an error if non-listed attributes are received

      // For every validation error create and throw a custom validation error
      // which is then handled by the global exception filter
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new ValidationException(validationErrors)
      },
    }),
  )

  // Colyseus setup
  const colyseusServer = new Server({
    transport: new WebSocketTransport({
      server: app.getHttpServer(),
    }),
  })

  colyseusServer.define('solo', injectDeps(app, SoloRoom), { gameType: 'SOLO' })
  colyseusServer.define('multiplayer', injectDeps(app, MultiplayerRoom))

  // Starts listening for shutdown hooks
  app.enableShutdownHooks()

  // Port on which the application will run
  const port = configService.get<number>('APP_PORT') || 3000

  // Initialize the Nest application
  await app.init()

  // Initialize the colyseus server
  await colyseusServer
    .listen(port)
    .then(async () => logger.verbose(`Application running at: ${port}`))
}

bootstrap()
