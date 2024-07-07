import { Client, Delayed, Room } from 'colyseus'
import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import PrismaService from '../../prisma/prisma.service'
import MultiplayerRoomState from './states/multiplayer-room.state'
import Player from './states/player.state'
import {
  FIRST_CYCLE_TIME,
  MID_GAME_COUNTDOWN,
  SECOND_CYCLE_TIME,
  START_COUNTDOWN,
  THIRD_CYCLE_TIME,
} from '../../commons/constants/game-time.constant'
import Word from './states/word.state'

@Injectable()
export default class MultiplayerRoom extends Room<MultiplayerRoomState> {
  logger: Logger

  /**
   * For the game preparation visual(s) to be shown
   */
  public waitingCountdownInterval: Delayed

  /**
   * The time elapsed for the game per cycle
   */
  public gameTimeInterval: Delayed

  constructor(private readonly prismaService: PrismaService) {
    super()
    this.logger = new Logger('MultiplayerRoom')
  }

  /**
   * Validate client auth token before joining/creating the room
   * @param token
   */
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
    // Create a multiplayer room state and set it as the room's state
    const roomState = new MultiplayerRoomState({
      word: undefined,
      guessing: false,
      round: 0,
      totalRound: 5, // TODO change this to `game.Words.length`
      time: FIRST_CYCLE_TIME,
      cycle: 1,
      waitingCountdownTime: START_COUNTDOWN,
      words: [], // TODO get this from the DB
      gameState: 'START_COUNTDOWN',
      winner: null,
      score: null,
      gameStarted: false,
    })
    this.setState(roomState)

    this.registerMessages()
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

  /**
   * Delayed countdown
   * @param timeoutTime
   */
  createCountdown(timeoutTime: number) {
    this.waitingCountdownInterval = this.clock.setInterval(() => {
      this.state.waitingCountdownTime -= 1
    }, 1000)

    this.clock.setTimeout(
      () => {
        this.state.gameState = 'GAME_STARTED'
        this.firstCycle()
        this.waitingCountdownInterval.clear()
      },
      (timeoutTime + 1) * 1000,
    )
  }

  /**
   * Run the first cycle of the current game round
   */
  firstCycle() {
    this.state.time = FIRST_CYCLE_TIME // Set time to the first time constant
    this.state.cycle = 1 // Set the cycle number
    this.state.winner = null // Reset the winner state
    this.state.round += 1 // Goto the next round
    this.state.word = this.state.words[this.state.round - 1] // Choose the word to be played from the words list
    this.gameTimeInterval = this.clock.setInterval(() => {
      this.state.time -= 1

      if (this.state.time <= 0) {
        this.state.time = SECOND_CYCLE_TIME
        this.state.word.cues[3].shown = true
        this.gameTimeInterval.clear()
        this.secondCycle()
      }
    }, 1000)
  }

  /**
   * Run the second cycle of the current game round
   */
  secondCycle() {
    this.state.cycle = 2
    this.gameTimeInterval = this.clock.setInterval(() => {
      this.state.time -= 1

      if (this.state.time <= 0) {
        this.state.time = THIRD_CYCLE_TIME
        this.state.word.cues[4].shown = true
        this.gameTimeInterval.clear()
        this.thirdCycle()
      }
    }, 1000)
  }

  /**
   * Run the third cycle of the current game round.
   * Plus decides whether to end the round or the whole game based on
   * remaining words
   */
  thirdCycle() {
    this.state.cycle = 3
    this.gameTimeInterval = this.clock.setInterval(async () => {
      this.state.time -= 1

      if (this.state.time <= 0) {
        await this.stopCurrentRoundOrGame()
        this.gameTimeInterval.clear()
      }
    }, 1000)
  }

  /**
   * Prepare the necessary steps needed for a multiplayer game to start
   */
  async startGame() {
    // Fetch the associated game with the current game
    const room = await this.prismaService.room.findUnique({
      where: { room_id: this.roomId },
    })
    if (room) {
      const game = await this.prismaService.game.findFirst({
        where: { room_id: room.id },
        include: { Words: true },
      })

      // Set the words state variable
      if (game) {
        this.state.words = game.Words.map((word) => new Word(word))
      }

      // Start game preparation countdown
      this.createCountdown(START_COUNTDOWN)
      this.state.gameStarted = true
    }
  }

  /**
   * Handle the guess message
   * @param client
   * @param message
   * @private
   */
  async guess(client: Client, message: { guess: string }) {
    const isWinner = await this.checkForWinner(message.guess)

    if (isWinner) {
      this.state.winner = client.sessionId
      await this.stopCurrentRoundOrGame()
    }
  }

  /**
   * To put the currently running round or game to halt based on some conditions
   * @private
   */
  private async stopCurrentRoundOrGame() {
    this.state.gameState = 'ROUND_END'
    this.state.waitingCountdownTime = MID_GAME_COUNTDOWN
    this.gameTimeInterval.clear()

    // Game is not done but the current round is
    if (this.state.words.length > this.state.round) {
      this.createCountdown(MID_GAME_COUNTDOWN)
    } else {
      this.waitingCountdownInterval = this.clock.setInterval(() => {
        this.state.waitingCountdownTime -= 1

        if (this.state.waitingCountdownTime <= 0) {
          this.state.gameState = 'GAME_END'
          this.state.time = 0
          this.state.word = undefined
          this.waitingCountdownInterval.clear()
        }
      }, 1000)
    }
  }

  /**
   * Check if the guessed word matches the currently being played word's key
   * @param guess
   * @private
   */
  private async checkForWinner(guess: string) {
    // Get the currently being played word
    const wordBeingGuessed = await this.prismaService.word.findUnique({
      where: { id: this.state.word.id },
    })

    if (wordBeingGuessed) {
      // Cast to lowercase for case-insensitive comparison
      return wordBeingGuessed.key.toLowerCase() === guess.toLowerCase()
    }

    return false
  }

  /**
   * Subscribe to necessary websocket messages
   * @private
   */
  private registerMessages() {
    this.onMessage('exit', (client) => client.leave())

    this.onMessage('start-game', () => this.startGame())

    this.onMessage('guess', (client, message: { guess: string }) =>
      this.guess(client, message),
    )
  }
}
