import { Module } from '@nestjs/common'

import MailModule from '../../mail/mail.module'
import GameModule from '../games/games.module'
import ScheduledGamesController from './scheduled-games.controller'
import ScheduledGamesService from './scheduled-games.service'

@Module({
  imports: [GameModule, MailModule],
  controllers: [ScheduledGamesController],
  providers: [ScheduledGamesService],
})
export default class ScheduledGamesModule {}
