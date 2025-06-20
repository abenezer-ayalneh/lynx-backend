import { tz } from '@date-fns/tz/tz'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron } from '@nestjs/schedule'
import { ScheduledGame, ScheduledGameReminder, ScheduledGameType } from '@prisma/client'
import { JsonArray } from '@prisma/client/runtime/library'
import { matchMaker } from 'colyseus'
import { addMinutes, constructNow, format, parseISO } from 'date-fns'

import { SCHEDULED_GAME_REMINDER_MINUTES } from '../../commons/constants/email.constant'
import { ActivePlayerData } from '../../iam/types/active-player-data.type'
import MailService from '../../mail/mail.service'
import PrismaService from '../../prisma/prisma.service'
import TIMEZONES from './constants/timezones.constants'
import CreateMultiplayerRoomDto from './dto/create-multiplayer-room.dto'
import RsvpDto from './dto/rsvp.dto'

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

  async create(activePlayerData: ActivePlayerData, createRoomDto: CreateMultiplayerRoomDto) {
    if (createRoomDto.gameScheduleType === ScheduledGameType.FUTURE) {
      return this.handleFutureScheduledGame(activePlayerData, createRoomDto)
    }

    return this.handleInstantScheduledGame(activePlayerData, createRoomDto)
  }

  findOne(id: number) {
    return this.prismaService.scheduledGame.findUnique({
      where: { id },
      select: { id: true, type: true, start_time: true, invited_emails: true, accepted_emails: true, created_by: true },
    })
  }

  async rsvp(rsvpDto: RsvpDto) {
    const game = await this.findOne(Number(rsvpDto.gameId))

    if (game && game.invited_emails.includes(rsvpDto.email)) {
      // Avoid adding entry if the email that is RSVP-ing has already RSVP-ed.
      if (game.accepted_emails && (game.accepted_emails as JsonArray).some((emailObject) => emailObject['email'] === rsvpDto.email)) {
        return game
      }

      return this.prismaService.scheduledGame.update({
        where: {
          id: Number(rsvpDto.gameId),
        },
        data: {
          accepted_emails: [
            ...((game.accepted_emails ?? []) as JsonArray),
            {
              email: rsvpDto.email,
              reminder: ScheduledGameReminder.PENDING,
            },
          ] as JsonArray,
        },
      })
    }

    throw new NotFoundException('Game not found')
  }

  @Cron('*/1 * * * *')
  private async invitationJob() {
    const now = constructNow(new Date())
    // Get games that are within 10 minutes reach and has participants who has not received a reminder email.
    const scheduledGames = await this.prismaService.scheduledGame.findMany({
      where: {
        start_time: {
          lte: addMinutes(now, SCHEDULED_GAME_REMINDER_MINUTES), // Check for games that will start within a specific minutes(e.g. 10 minutes)
        },
        type: ScheduledGameType.FUTURE,
        accepted_emails: {
          array_contains: [{ reminder: ScheduledGameReminder.PENDING }],
        },
      },
    })

    if (scheduledGames.length > 0) {
      for (let i = 0; i < scheduledGames.length; i++) {
        const game = scheduledGames[i]
        await this.inviteToLobby(game)

        // Update the game by setting the reminder value as SENT
        await this.prismaService.scheduledGame.update({
          where: {
            id: game.id,
          },
          data: {
            accepted_emails: (game.accepted_emails as JsonArray).map((emailObject) => ({
              email: emailObject['email'] as string,
              reminder: ScheduledGameReminder.SENT,
            })),
          },
        })
      }
    }
  }

  private async handleFutureScheduledGame(activePlayerData: ActivePlayerData, createRoomDto: CreateMultiplayerRoomDto) {
    const emailsToSendInvitationTo = [...createRoomDto.emails, activePlayerData.email]

    const startTimeIso = parseISO(createRoomDto.start_time, {
      in: tz(createRoomDto.timezone),
    })

    const scheduledGame = await this.prismaService.scheduledGame.create({
      data: {
        invitation_text: createRoomDto.invitation_text,
        invited_emails: emailsToSendInvitationTo,
        start_time: startTimeIso.toISOString(),
        type: ScheduledGameType.FUTURE,
        Owner: {
          connect: {
            id: activePlayerData.sub,
          },
        },
      },
    })

    // Send invitation email
    const emailSchedulePromises: Promise<{
      code: string
      message: string
    }>[] = []

    for (let i = 0; i < emailsToSendInvitationTo.length; i += 1) {
      const email = emailsToSendInvitationTo[i]
      const iAmInLink = `${this.configService.get<string>('FRONTEND_APP_URL')}/scheduled-game/rsvp?gameId=${scheduledGame.id}&email=${email}`

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
      await Promise.all(emailSchedulePromises)
    }

    return true
  }

  private async handleInstantScheduledGame(activePlayerData: ActivePlayerData, createRoomDto: CreateMultiplayerRoomDto) {
    // Instant game invitation
    const startTimeIso = constructNow(new Date())
    const scheduledGame = await this.prismaService.scheduledGame.create({
      data: {
        invitation_text: createRoomDto.invitation_text,
        invited_emails: createRoomDto.emails,
        accepted_emails: createRoomDto.emails.map((email) => ({ email, reminder: ScheduledGameReminder.PENDING })),
        start_time: startTimeIso.toISOString(),
        type: ScheduledGameType.INSTANT,
        Owner: {
          connect: {
            id: activePlayerData.sub,
          },
        },
      },
    })

    return this.inviteToLobby(scheduledGame)
  }

  private async inviteToLobby(scheduledGame: ScheduledGame) {
    const returnValue = { lobbyId: null, gameId: null }
    const gameReminderEmailPromises: Promise<{
      code: string
      message: string
    }>[] = []

    const emailsToInviteToLobby = (scheduledGame.accepted_emails as JsonArray)
      .filter((emailObject) => emailObject['reminder'] === ScheduledGameReminder.PENDING)
      .map((emailObject) => emailObject['email'] as string)

    if (emailsToInviteToLobby.length > 0) {
      const room = await matchMaker.createRoom('multiplayer', {
        gameId: scheduledGame.id,
      })

      returnValue.lobbyId = room.roomId
      returnValue.gameId = scheduledGame.id
      emailsToInviteToLobby.forEach((email) => {
        gameReminderEmailPromises.push(
          this.mailService.sendMail({
            to: [email],
            from: this.configService.get('MAIL_FROM'),
            subject: 'Lynx Game Reminder',
            template: './game-reminder',
            context: {
              reminderMinutes: SCHEDULED_GAME_REMINDER_MINUTES,
              link: `${this.configService.get<string>('FRONTEND_APP_URL')}/scheduled-game/${scheduledGame.id}/${room.roomId}`,
            },
          }),
        )
      })
    }

    if (gameReminderEmailPromises.length > 0) {
      await Promise.all(gameReminderEmailPromises)
    }

    return returnValue
  }
}
