import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AccessToken } from 'livekit-server-sdk'

import { GetTokenDto } from './dto/get-token.dto'

@Injectable()
export class LiveKitService {
  constructor(private readonly configService: ConfigService) {}

  async getToken(getTokenDto: GetTokenDto) {
    // If this room doesn't exist, it'll be automatically created when the first
    // participant joins
    const roomName = `live-kit-room-${getTokenDto.colyseusRoomId}`
    // Identifier to be used for participant.
    // It's available as LocalParticipant.identity with live-kit-client SDK
    const participantName = `live-kit-player-${getTokenDto.sessionId}`

    const at = new AccessToken(this.configService.get<string>('LIVEKIT_API_KEY'), this.configService.get<string>('LIVEKIT_API_SECRET'), {
      identity: participantName,
      // Token to expire after 10 minutes
      ttl: '10m',
    })
    at.addGrant({ roomJoin: true, room: roomName })

    return { token: await at.toJwt() }
  }
}
