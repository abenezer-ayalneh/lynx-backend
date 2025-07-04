import { tz } from '@date-fns/tz/tz'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ScheduledGame } from '@prisma/client'
import { matchMaker } from 'colyseus'
import { format, parseISO } from 'date-fns'

import { SCHEDULED_GAME_REMINDER_MINUTES } from '../../commons/constants/email.constant'
import { ActivePlayerData } from '../../iam/types/active-player-data.type'
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

	async create(activePlayerData: ActivePlayerData, createRoomDto: CreateMultiplayerRoomDto) {
		const room = await matchMaker.createRoom('multiplayer', {})

		const emailsToSendInvitationTo = [...createRoomDto.emails, activePlayerData.email]

		const startTimeIsoWithTimezone =
			createRoomDto.start_time && createRoomDto.timezone
				? parseISO(createRoomDto.start_time, {
						in: tz(createRoomDto.timezone),
					})
				: new Date()

		const scheduledGame = await this.prismaService.scheduledGame.create({
			data: {
				invitation_text: createRoomDto.invitation_text,
				invited_emails: emailsToSendInvitationTo,
				room_id: room.roomId,
				start_time: startTimeIsoWithTimezone.toISOString(),
				type: createRoomDto.gameScheduleType,
				Owner: {
					connect: {
						id: activePlayerData.sub,
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
			select: { id: true, room_id: true, start_time: true, type: true, Owner: { select: { id: true } } },
		})
	}

	private async sendInvitationEmails(scheduledGame: ScheduledGame, timeZone: string) {
		const emailPromises: Promise<{
			code: string
			message: string
		}>[] = []

		const emailsToInvite = scheduledGame.invited_emails

		if (emailsToInvite.length > 0) {
			emailsToInvite.forEach((email) => {
				emailPromises.push(
					this.mailService.sendMail({
						to: [email],
						from: this.configService.get('MAIL_FROM'),
						subject: 'Lynx Game Invitation',
						template: './game-invitation',
						context: {
							invitationText: scheduledGame.invitation_text,
							date: format(scheduledGame.start_time, 'yyyy-MM-dd'),
							time: format(scheduledGame.start_time, 'hh:mm aa'),
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
