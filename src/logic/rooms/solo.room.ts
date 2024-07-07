import { Delayed, Room } from 'colyseus'
import { Injectable, Logger } from '@nestjs/common'
import RoomState from './states/room.state'
import {
  FIRST_CYCLE_TIME,
  MID_GAME_COUNTDOWN,
  SECOND_CYCLE_TIME,
  START_COUNTDOWN,
  THIRD_CYCLE_TIME,
} from '../../commons/constants/game-time.constant'
import PrismaService from '../../prisma/prisma.service'
import Word from './states/word.state'
import { RoomCreateProps } from './types/solo-room-props.type'
import GUESS from './constants/message.constant'
import {
  FIRST_CYCLE_SCORE,
  SECOND_CYCLE_SCORE,
  THIRD_CYCLE_SCORE,
} from './constants/score.constant'

@Injectable()
export default class SoloRoom extends Room<RoomState> {
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
   * Initiate a room and subscribe to the guess message type
   * @param data
   */
  async onCreate(data: RoomCreateProps) {
    // Create the solo game state
    await this.createSoloGameState(data)

    // Start game preparation countdown
    this.createCountdown(START_COUNTDOWN)

    this.onMessage(GUESS, async (client, message: { guess: string }) => {
      const winner = await this.checkForWinner(message.guess)
      if (winner) {
        await this.handleGameWon()
      }
    })
  }

  /**
   * Handle all the necessary steps when a player wins a round
   */
  async handleGameWon() {
    this.state.winner = true
    let playerScore = 0
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
      default:
        playerScore = 0
    }

    this.state.score += playerScore
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
    const roomState = new RoomState({
      word: undefined,
      guessing: false,
      round: 0,
      totalRound: game.Words.length,
      time: FIRST_CYCLE_TIME,
      cycle: 1,
      waitingCountdownTime: START_COUNTDOWN,
      words,
      gameState: 'START_COUNTDOWN',
      winner: false,
      score: 0,
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
    this.state.winner = false // Reset the winner state
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

  // private async checkForWinnerWord(word: string) {}

  // (optional) Validate client auth token before joining/creating the room
  // static async onAuth(token: string, request: IncomingMessage) {}
  //
  // // When client successfully join the room
  // onJoin(client: Client, options: any, auth: any) {}
  //
  // // When a client leaves the room
  // onLeave(client: Client, consented: boolean) {
  //   this.delayedInterval.clear()
  // }
  //
  // // Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
  // onDispose() {
  //   this.delayedInterval.clear()
  // }
}
