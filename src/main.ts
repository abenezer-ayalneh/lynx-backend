import { monitor } from '@colyseus/monitor'
import { playground } from '@colyseus/playground'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { INestApplication, Logger, ValidationError, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { logger, Room, Server } from 'colyseus'
import * as basicAuth from 'express-basic-auth'
import { WinstonModule } from 'nest-winston'

import AppModule from './app.module'
import MultiplayerRoom from './logic/scheduled-games/multiplayer.room'
import SoloRoom from './logic/scheduled-games/solo.room'
import ValidationException from './utils/exceptions/validation.exception'
import winstonLoggerInstance from './utils/log/winston.log'

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
function injectDeps<T extends { new (...args: any[]): Room }>(app: INestApplication, target: T): { new (...args: any[]): {} & any; prototype: object } {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const selfDeps = Reflect.getMetadata('self:paramtypes', target) || []
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const dependencies = Reflect.getMetadata('design:paramtypes', target) || []

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  selfDeps.forEach((dep: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    dependencies[dep.index] = dep.param
  })

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const injectables =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    dependencies.map((dependency: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-argument
      return app.get(dependency)
    }) || []

  return class extends target {
    constructor(...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      super(...injectables, args)
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: winstonLoggerInstance }),
  })

  // Colyseus playground
  app.use('/playground', playground)

  // Colyseus monitor
  const basicAuthMiddleware = basicAuth({
    // list of users and passwords
    users: {
      admin: 'admin',
    },
    // sends WWW-Authenticate header, which will prompt the user to fill
    // credentials in
    challenge: true,
  })

  app.use('/monitor', basicAuthMiddleware, monitor())

  // Config service to access .env file
  const configService = app.get(ConfigService)

  // Logger to log stuff into console
  const logger = new Logger()

  // Enable CORS from allowed origins listed in .env
  app.enableCors({
    origin: configService.get<string>('CORS_ALLOWED_ORIGINS') ? configService.get<string>('CORS_ALLOWED_ORIGINS').split(',') : false,
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      server: app.getHttpServer(),
      maxPayload: 1024 * 1024, // 1MB Max Payload
    }),
  })

  colyseusServer.define('solo', injectDeps(app, SoloRoom), { gameType: 'SOLO' })
  colyseusServer.define('multiplayer', injectDeps(app, MultiplayerRoom), { gameType: 'MULTIPLAYER' })

  // Starts listening for shutdown hooks
  app.enableShutdownHooks()

  // Port on which the application will run
  const port = configService.get<number>('APP_PORT') || 3000

  // Initialize the Nest application
  await app.init()

  // Initialize the colyseus server
  await colyseusServer.listen(port).then(() => logger.verbose(`Application running at: ${port}`))
}

bootstrap()
  .then(() => logger.info('Application is running'))
  .catch((err) => logger.info(err, 'Application failed to start'))
