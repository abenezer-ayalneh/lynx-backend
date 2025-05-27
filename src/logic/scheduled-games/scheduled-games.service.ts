import { tz } from '@date-fns/tz/tz'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron } from '@nestjs/schedule'
import { ScheduledGame, ScheduledGameReminder, ScheduledGameStatus, ScheduledGameType } from '@prisma/client'
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
    return this.prismaService.scheduledGame.findUnique({ where: { id } })
  }

  async rsvp(rsvpDto: RsvpDto) {
    const game = await this.findOne(Number(rsvpDto.gameId))

    if (game && game.invited_emails.includes(rsvpDto.email)) {
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
  private async invitationJob() {
    const now = constructNow(new Date())
    // Get games that are within 10 minutes reach and has not sent invitation to the participants
    const scheduledGames = await this.prismaService.scheduledGame.findMany({
      where: {
        start_time: {
          lte: addMinutes(now, SCHEDULED_GAME_REMINDER_MINUTES),
        },
        type: ScheduledGameType.FUTURE,
        accepted_emails: { isEmpty: false },
        reminder: ScheduledGameReminder.PENDING,
      },
    })

    if (scheduledGames.length > 0) {
      for (let i = 0; i < scheduledGames.length; i++) {
        const game = scheduledGames[i]
        await this.inviteToLobby(game)
      }

      // Update the game by setting the reminder value as SENT
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
    }
  }

  // @Cron('*/1 * * * *')
  private async activateGame() {
    const now = constructNow(new Date())
    await this.prismaService.scheduledGame.updateMany({
      where: {
        start_time: {
          lte: now,
        },
        status: ScheduledGameStatus.PENDING,
      },
      data: {
        status: ScheduledGameStatus.ACTIVE,
      },
    })
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

    return ''
  }

  private async handleInstantScheduledGame(activePlayerData: ActivePlayerData, createRoomDto: CreateMultiplayerRoomDto) {
    const emailsToSendInvitationTo = [
      ...createRoomDto.emails,
      // activePlayerData.email,
    ]

    // Instant game invitation
    const startTimeIso = constructNow(new Date())
    const scheduledGame = await this.prismaService.scheduledGame.create({
      data: {
        invitation_text: createRoomDto.invitation_text,
        invited_emails: emailsToSendInvitationTo,
        accepted_emails: emailsToSendInvitationTo,
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

  private async inviteToLobby(game: ScheduledGame) {
    const returnValue = { lobbyId: null }
    const gameReminderEmailPromises: Promise<{
      code: string
      message: string
    }>[] = []

    if (game.accepted_emails.length > 0) {
      const room = await matchMaker.createRoom('lobby', {
        gameId: game.id,
        startTime: game.start_time.toISOString(),
        ownerId: game.created_by,
      })

      returnValue.lobbyId = room.roomId
      game.accepted_emails.forEach((email) => {
        gameReminderEmailPromises.push(
          this.mailService.sendMail({
            to: [email],
            from: this.configService.get('MAIL_FROM'),
            subject: 'Lynx Game Reminder',
            template: './game-reminder',
            context: {
              reminderMinutes: SCHEDULED_GAME_REMINDER_MINUTES,
              link: `${this.configService.get<string>('FRONTEND_APP_URL')}/scheduled-game/lobby?id=${room.roomId}`,
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
