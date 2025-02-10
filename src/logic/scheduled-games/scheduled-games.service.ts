import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { addMinutes, constructNow, format, parseISO } from 'date-fns'
import { matchMaker } from 'colyseus'

import { ScheduledGameReminder, ScheduledGameStatus } from '@prisma/client'
import { Cron } from '@nestjs/schedule'
import { tz } from '@date-fns/tz/tz'
import CreateMultiplayerRoomDto from './dto/create-multiplayer-room.dto'
import PrismaService from '../../prisma/prisma.service'
import MailService from '../../mail/mail.service'
import RsvpDto from './dto/rsvp.dto'
import { SCHEDULED_GAME_REMINDER_MINUTES } from '../../commons/constants/email.constant'
import { ActivePlayerData } from '../../iam/types/active-player-data.type'
import TIMEZONES from './constants/timezones.constants'

@Injectable()
export default class ScheduledGamesService {
  logger: Logger

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.logger = new Logger('ScheduledGamesService')
  }

  async create(
    activePlayerData: ActivePlayerData,
    createRoomDto: CreateMultiplayerRoomDto,
  ) {
    const emailsToSendInvitationTo = [
      ...createRoomDto.emails,
      activePlayerData.email,
    ]

    const startTimeIso = parseISO(createRoomDto.start_time, {
      in: tz(createRoomDto.timezone),
    })

    const scheduledGame = await this.prismaService.scheduledGame.create({
      data: {
        invitation_text: createRoomDto.invitation_text,
        invited_emails: emailsToSendInvitationTo,
        start_time: startTimeIso.toISOString(),
        Owner: {
          connect: {
            id: activePlayerData.sub,
          },
        },
      },
    })

    // Send invitation email
    const emailSchedulePromises: Promise<{ code: string; message: string }>[] =
      []

    for (let i = 0; i < emailsToSendInvitationTo.length; i += 1) {
      const email = emailsToSendInvitationTo[i]
      const iAmInLink = `${this.configService.get<string>('FRONTEND_APP_URL')}/rsvp?gameId=${scheduledGame.id}&email=${email}`

      emailSchedulePromises.push(
        this.mailService.sendMail({
          to: [email],
          from: this.configService.get('MAIL_FROM'),
          subject: 'Lynx Game Invitation',
          template: './game-invitation',
          context: {
            invitationText: createRoomDto.invitation_text,
            date: format(startTimeIso, 'yyyy-MM-dd'),
            time: format(startTimeIso, 'hh:mm aa'),
            timezone: TIMEZONES[createRoomDto.timezone].name,
            url: iAmInLink,
          },
        }),
      )
    }

    if (emailSchedulePromises.length > 0) {
      return Promise.all(emailSchedulePromises)
    }

    return null
  }

  findOne(id: number) {
    return this.prismaService.scheduledGame.findUnique({ where: { id } })
  }

  async rsvp(rsvpDto: RsvpDto) {
    const game = await this.findOne(Number(rsvpDto.gameId))

    if (game) {
      if (game.accepted_emails.includes(rsvpDto.email)) {
        return game
      }
      return this.prismaService.scheduledGame.update({
        where: {
          id: Number(rsvpDto.gameId),
        },
        data: {
          accepted_emails: {
            push: rsvpDto.email,
          },
        },
      })
    }

    throw new NotFoundException('Game not found')
  }

  @Cron('*/1 * * * *')
  async invitation() {
    const now = constructNow(new Date())
    const scheduledGames = await this.prismaService.scheduledGame.findMany({
      where: {
        start_time: {
          lte: addMinutes(now, SCHEDULED_GAME_REMINDER_MINUTES),
        },
        accepted_emails: { isEmpty: false },
        reminder: ScheduledGameReminder.PENDING,
      },
    })

    if (scheduledGames.length > 0) {
      const gameReminderEmailPromises: Promise<{
        code: string
        message: string
      }>[] = []

      scheduledGames.forEach((game) => {
        if (game.accepted_emails.length > 0) {
          matchMaker
            .createRoom('lobby', {
              gameId: game.id,
              startTime: game.start_time.toISOString(),
            })
            .then((room) => {
              gameReminderEmailPromises.push(
                this.mailService.sendMail({
                  to: game.accepted_emails,
                  from: this.configService.get('MAIL_FROM'),
                  subject: 'Lynx Game Reminder',
                  template: './game-reminder',
                  context: {
                    reminderMinutes: SCHEDULED_GAME_REMINDER_MINUTES,
                    link: `${this.configService.get<string>('FRONTEND_APP_URL')}/lobby?id=${room.roomId}`,
                  },
                }),
              )
            })
        }
      })

      await this.prismaService.scheduledGame.updateMany({
        where: {
          id: {
            in: scheduledGames.map((game) => game.id),
          },
        },
        data: {
          reminder: ScheduledGameReminder.SENT,
        },
      })

      if (gameReminderEmailPromises.length > 0) {
        await Promise.all(gameReminderEmailPromises)
      }
    }
  }

  @Cron('*/1 * * * *')
  async activateGame() {
    const now = constructNow(new Date())
    await this.prismaService.scheduledGame.updateMany({
      where: {
        start_time: {
          gte: now,
        },
        status: ScheduledGameStatus.PENDING,
      },
      data: {
        status: ScheduledGameStatus.ACTIVE,
      },
    })
  }
}
