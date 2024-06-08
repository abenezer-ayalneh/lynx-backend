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
import { RoomCreateProps } from './types/room-props.type'
import GUESS from './constants/message.constant'

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

  // When room is initialized
  async onCreate(data: RoomCreateProps) {
    await this.createSoloGame(data)
    this.onMessage(GUESS, async (client, message: { guess: string }) => {
      const winner = await this.checkForWinner(message.guess)
      if (winner) {
        await this.stopCurrentRoundOrGame()
      }
      client.send(GUESS, { winner })
    })
  }

  async createSoloGame(data: RoomCreateProps) {
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
      round: 1,
      totalRound: game.Words.length,
      time: FIRST_CYCLE_TIME,
      cycle: 1,
      numberOfPlayers: 1,
      waitingCountdownTime: START_COUNTDOWN,
      words,
      gameState: 'START_COUNTDOWN',
    })

    // Set the room's state
    this.setState(roomState)

    // Start game preparation countdown
    this.createCountdown(START_COUNTDOWN)
  }

  /**
   * Delayed countdown
   * @param countdown
   */
  createCountdown(countdown: number) {
    this.waitingCountdownInterval = this.clock.setInterval(() => {
      this.state.waitingCountdownTime -= 1
    }, 1000)

    this.clock.setTimeout(
      () => {
        this.state.gameState = 'GAME_STARTED'
        this.firstCycle()
        this.waitingCountdownInterval.clear()
      },
      (countdown + 1) * 1000,
    )
  }

  /**
   * Run the first cycle of the current game round
   */
  firstCycle() {
    this.state.word = this.state.words[this.state.round - 1]
    this.gameTimeInterval = this.clock.setInterval(() => {
      this.state.time -= 1
    }, 1000)

    this.clock.setTimeout(() => {
      this.state.time = SECOND_CYCLE_TIME
      this.state.word.cues[3].shown = true
      this.gameTimeInterval.clear()
      this.secondCycle()
    }, FIRST_CYCLE_TIME * 1000)
  }

  /**
   * Run the second cycle of the current game round
   */
  secondCycle() {
    this.gameTimeInterval = this.clock.setInterval(() => {
      this.state.time -= 1
    }, 1000)

    this.clock.setTimeout(() => {
      this.state.time = THIRD_CYCLE_TIME
      this.state.word.cues[4].shown = true
      this.gameTimeInterval.clear()
      this.thirdCycle()
    }, SECOND_CYCLE_TIME * 1000)
  }

  /**
   * Run the third cycle of the current game round.
   * Plus decides whether to end the round or the whole game based on
   * remaining words
   */
  thirdCycle() {
    this.gameTimeInterval = this.clock.setInterval(() => {
      this.state.time -= 1
    }, 1000)

    this.clock.setTimeout(async () => {
      await this.stopCurrentRoundOrGame()
      this.gameTimeInterval.clear()
    }, THIRD_CYCLE_TIME * 1000)
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
    // Game is not done but the current round is
    if (this.state.words.length > this.state.round) {
      this.state.gameState = 'ROUND_END'
      this.state.round += 1
      // this.state.word = this.state.words[this.state.round - 1]
      this.state.time = FIRST_CYCLE_TIME
      this.state.guessing = false
      this.state.numberOfPlayers = 0
      this.state.waitingCountdownTime = 10
      this.gameTimeInterval.clear()
      this.createCountdown(MID_GAME_COUNTDOWN)
    } else {
      this.state.gameState = 'GAME_END'
      this.state.time = 0
      this.state.cycle = 0
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
