import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { UserSession } from '@thallesp/nestjs-better-auth'
import { AccessToken, TrackSource } from 'livekit-server-sdk'

import PrismaService from '../prisma/prisma.service'
import { GetTokenDto } from './dto/get-token.dto'

@Injectable()
export class LiveKitService {
	constructor(
		private readonly configService: ConfigService,
		private readonly prismaService: PrismaService,
	) {}

	async getToken(session: UserSession | null, getTokenDto: GetTokenDto) {
		const scheduledGame = await this.prismaService.scheduledGame.findUnique({
			where: { id: getTokenDto.gameId },
			select: { createdBy: true, invitedEmails: true },
		})

		if (!scheduledGame) {
			throw new NotFoundException('Game not found')
		}

		// Verify game membership for authenticated users
		if (session) {
			const isOwner = scheduledGame.createdBy === session.user.id
			const isInvited = scheduledGame.invitedEmails.includes(session.user.email)
			if (!isOwner && !isInvited) {
				throw new ForbiddenException('You are not a participant in this game')
			}
		}

		// Always use Colyseus sessionId as the LiveKit identity so it matches the
		// player ID in the Colyseus room state. This ensures remote tracks, mute
		// state, and speaking indicators map correctly to player avatars.
		const roomName = `lynx-voice-room-${getTokenDto.gameId}`

		const at = new AccessToken(this.configService.get<string>('LIVEKIT_API_KEY'), this.configService.get<string>('LIVEKIT_API_SECRET'), {
			identity: getTokenDto.sessionId,
			name: session?.user.name ?? getTokenDto.sessionId,
			ttl: '2h',
		})
		at.addGrant({
			roomJoin: true,
			room: roomName,
			canPublish: true,
			canSubscribe: true,
			canPublishSources: [TrackSource.MICROPHONE],
		})

		return { token: await at.toJwt() }
	}
}
