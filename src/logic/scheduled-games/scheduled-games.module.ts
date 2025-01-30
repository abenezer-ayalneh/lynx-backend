import { Module } from '@nestjs/common'
import ScheduledGamesService from './scheduled-games.service'
import ScheduledGamesController from './scheduled-games.controller'
import GameModule from '../games/games.module'
import MailModule from '../../mail/mail.module'

@Module({
  imports: [GameModule, MailModule],
  controllers: [ScheduledGamesController],
  providers: [ScheduledGamesService],
})
export default class ScheduledGamesModule {}
