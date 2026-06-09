import { tz } from '@date-fns/tz/tz'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ScheduledGame } from '@prisma/client'
import { UserSession } from '@thallesp/nestjs-better-auth'
import { matchMaker } from 'colyseus'
import { format, parseISO } from 'date-fns'

import { SCHEDULED_GAME_REMINDER_MINUTES } from '../../commons/constants/email.constant'
import MailService from '../../mail/mail.service'
import PrismaService from '../../prisma/prisma.service'
import TIMEZONES from './constants/timezones.constants'
import CreateMultiplayerRoomDto from './dto/create-multiplayer-room.dto'

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

	async create(session: UserSession, createRoomDto: CreateMultiplayerRoomDto) {
		const emailsToSendInvitationTo = [...createRoomDto.emails, session.user.email]

		const startTimeIsoWithTimezone =
			createRoomDto.startTime && createRoomDto.timezone
				? parseISO(createRoomDto.startTime, {
						in: tz(createRoomDto.timezone),
					})
				: new Date()

		const room = await matchMaker.createRoom('multiplayer', { startTimeInMilliseconds: startTimeIsoWithTimezone.getTime() })

		const scheduledGame = await this.prismaService.scheduledGame.create({
			data: {
				invitationText: createRoomDto.invitationText,
				invitedEmails: emailsToSendInvitationTo,
				roomId: room.roomId,
				startTime: startTimeIsoWithTimezone.toISOString(),
				type: createRoomDto.gameScheduleType,
				owner: {
					connect: {
						id: session.user.id,
					},
				},
			},
		})

		await this.sendInvitationEmails(scheduledGame, createRoomDto.timezone)

		return scheduledGame
	}

	getById(gameId: string) {
		return this.prismaService.scheduledGame.findUnique({
			where: { id: gameId },
			select: { id: true, roomId: true, startTime: true, type: true, owner: { select: { id: true } } },
		})
	}

	private async sendInvitationEmails(scheduledGame: ScheduledGame, timeZone: string) {
		const emailPromises: Promise<{
			code: string
			message: string
		}>[] = []

		const emailsToInvite = scheduledGame.invitedEmails

		if (emailsToInvite.length > 0) {
			emailsToInvite.forEach((email) => {
				emailPromises.push(
					this.mailService.sendMail({
						to: [email],
						from: this.configService.get('MAIL_FROM'),
						subject: 'Lynx Game Invitation',
						template: './game-invitation',
						context: {
							invitationText: scheduledGame.invitationText,
							date: format(scheduledGame.startTime, 'yyyy-MM-dd'),
							time: format(scheduledGame.startTime, 'hh:mm aa'),
							timezone: TIMEZONES[timeZone]?.name ?? 'UTC',
							reminderMinutes: SCHEDULED_GAME_REMINDER_MINUTES,
							url: `${this.configService.get<string>('FRONTEND_APP_URL')}/game/scheduled/${scheduledGame.id}`,
						},
					}),
				)
			})
		}

		await Promise.all(emailPromises)
	}
}
