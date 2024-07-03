import { Client, Room } from 'colyseus'
import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import PrismaService from '../../prisma/prisma.service'
import MultiplayerRoomState from './states/multiplayer-room.state'
import Player from './states/player.state'

@Injectable()
export default class MultiplayerRoom extends Room<MultiplayerRoomState> {
  logger: Logger

  constructor(private readonly prismaService: PrismaService) {
    super()
    this.logger = new Logger('MultiplayerRoom')
  }

  // Validate client auth token before joining/creating the room
  static async onAuth(token: string) {
    if (!token) {
      return false
    }

    const jwtService = new JwtService()
    try {
      return await jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
        audience: process.env.JWT_TOKEN_AUDIENCE,
        issuer: process.env.JWT_TOKEN_ISSUER,
      })
    } catch (e) {
      return false
    }
  }

  /**
   * Initiate a room and subscribe to the guess message type
   */
  async onCreate() {
    const roomState = new MultiplayerRoomState()
    this.setState(roomState)
    this.onMessage('exit', (client) => {
      client.leave()
    })
  }

  /**
   * Triggered when a player successfully join the room
   */
  async onJoin(client: Client, options: any, auth: { sub: number }) {
    const player = await this.prismaService.player.findUnique({
      where: { id: auth.sub },
    })

    // Add unique players into the room's 'players' state
    if (
      !this.state.players.some((joinedPlayer) => joinedPlayer.id === auth.sub)
    ) {
      this.state.players.push(new Player(player.id, player.name, player.email))

      // Let the game be started when at least 2 players are in the room
      this.state.minPlayersSatisfied = this.state.players.length >= 2
    }
  }

  /**
   *  Triggered when a player leaves the room
   * @param client
   */
  onLeave(client: Client) {
    const indexToRemove = this.state.players.findIndex(
      (player) => player.id === client.auth.sub,
    )
    if (indexToRemove >= 0) {
      this.state.players.splice(indexToRemove, 1)
    }
  }
}
