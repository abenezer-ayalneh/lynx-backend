import { Client, Delayed, Room } from 'colyseus'
import { Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import SoloRoomState from './states/solo-room.state'
import {
  FIRST_CYCLE_TIME,
  FOURTH_CYCLE_TIME,
  MID_GAME_COUNTDOWN,
  SECOND_CYCLE_TIME,
  START_COUNTDOWN,
  THIRD_CYCLE_TIME,
} from '../../commons/constants/game-time.constant'
import PrismaService from '../../prisma/prisma.service'
import Word from './states/word.state'
import { RoomCreateProps } from './types/solo-room-props.type'
import { GUESS, WRONG_GUESS } from './constants/message.constant'
import { FIRST_CYCLE_SCORE, FOURTH_CYCLE_SCORE, SECOND_CYCLE_SCORE, THIRD_CYCLE_SCORE } from './constants/score.constant'
import Score from './states/score.state'

@Injectable()
export default class SoloRoom extends Room<SoloRoomState> {
  logger: Logger

  // For the game preparation visual(s) to be shown
  public waitingCountdownInterval: Delayed

  // This is the time elapsed for the game per cycle
  public gameTimeInterval: Delayed

  constructor(private readonly prismaService: PrismaService) {
    super()
    this.logger = new Logger('SoloRoom')
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
   * @param data
   */
  async onCreate(data: RoomCreateProps) {
    // Create the solo game state
    await this.createSoloGameState(data)

    // Set the player's ID into the state variable for later use. But it is not
    // sent via state update to the frontend
    this.state.playerId = data.playerId

    // Start game preparation countdown
    this.createCountdown(START_COUNTDOWN)

    this.registerMessages()
  }

  /**
   * Handle all the necessary steps when a player wins a round
   */
  async handleGameWon(sessionId: string) {
    let playerScore: number
    switch (this.state.cycle) {
      case 1:
        playerScore = FIRST_CYCLE_SCORE
        break
      case 2:
        playerScore = SECOND_CYCLE_SCORE
        break
      case 3:
        playerScore = THIRD_CYCLE_SCORE
        break
      case 4:
        playerScore = FOURTH_CYCLE_SCORE
        break
      default:
        playerScore = 0
    }

    this.state.totalScore += playerScore
    this.state.score = playerScore
    this.state.winner = new Score({
      id: sessionId,
      name: 'Player Name',
      score: playerScore,
    })
    await this.stopCurrentRoundOrGame()
  }

  async createSoloGameState(data: RoomCreateProps) {
    // Set the randomly selected word to the state object's `word` attribute
    const game = await this.prismaService.game.findUnique({
      where: { id: data.gameId },
      select: { Words: true },
    })
    const words = game.Words.map((word) => new Word(word))
    // const randomWord = await this.pickRandomWord()

    // Create a RoomState object
    const roomState = new SoloRoomState({
      word: undefined,
      guessing: false,
      round: 0,
      totalRound: game.Words.length,
      time: FIRST_CYCLE_TIME,
      cycle: 1,
      waitingCountdownTime: START_COUNTDOWN,
      words,
      gameState: 'START_COUNTDOWN',
      winner: null,
      score: 0,
      totalScore: 0,
    })

    // Set the room's state
    this.setState(roomState)
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
    this.state.score = 0
    this.gameTimeInterval = this.clock.setInterval(() => {
      this.state.time -= 1

      if (this.state.time <= 0) {
        this.state.time = SECOND_CYCLE_TIME
        this.state.word.cues[2].shown = true
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
        this.state.word.cues[3].shown = true
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
        this.state.time = FOURTH_CYCLE_TIME
        this.state.word.cues[4].shown = true
        this.gameTimeInterval.clear()
        this.fourthCycle()
      }
    }, 1000)
  }

  /**
   * Run the fourth cycle of the current game round.
   * Plus decides whether to end the round or the whole game based on
   * remaining words
   */
  fourthCycle() {
    this.state.cycle = 4
    this.gameTimeInterval = this.clock.setInterval(async () => {
      this.state.time -= 1

      if (this.state.time <= 0) {
        await this.stopCurrentRoundOrGame()
        this.gameTimeInterval.clear()
      }
    }, 1000)
  }

  // When client successfully join the room
  async onJoin(client: Client, options: any, auth: any) {
    const player = await this.prismaService.player.findUnique({
      where: { id: auth.sub },
    })

    if (player) {
      this.state.playerId = player.id
    }
  }

  /**
   * Check if the guessed word matches the currently being played word's key
   * @param guess
   * @private
   */
  private async checkForWinner(guess: string) {
    // Get the currently being played word
    const wordBeingGuessed = this.state.word

    if (wordBeingGuessed) {
      // Cast to lowercase for case-insensitive comparison
      return wordBeingGuessed.key.toLowerCase() === guess.toLowerCase()
    }

    return false
  }

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
          this.setPlayerScoreOnDatabase(this.state.totalScore)
        }
      }, 1000)
    }
  }

  private async setPlayerScoreOnDatabase(score: number) {
    await this.prismaService.player.update({
      where: { id: this.state.playerId },
      data: { score: { increment: score } },
    })
  }

  /**
   * Subscribe to necessary websocket messages
   * @private
   */
  private registerMessages() {
    this.onMessage('exit', (client) => client.leave())

    this.onMessage(GUESS, async (client, message: { guess: string }) => {
      const winner = await this.checkForWinner(message.guess)
      if (winner) {
        await this.handleGameWon(client.sessionId)
      } else {
        client.send(WRONG_GUESS, { guess: false })
      }
    })
  }
}
