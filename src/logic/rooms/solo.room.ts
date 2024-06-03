import { Delayed, Room } from 'colyseus'
import { Injectable, Logger } from '@nestjs/common'
import RoomState from './states/room.state'
import {
  FIRST_CYCLE_TIME,
  SECOND_CYCLE_TIME,
  START_COUNTDOWN,
  THIRD_CYCLE_TIME,
} from '../../commons/constants/game-time.constant'
import PrismaService from '../../prisma/prisma.service'
import Word from './states/word.state'
import { RoomCreateProps } from './types/room-props.type'

@Injectable()
export default class SoloRoom extends Room<RoomState> {
  logger: Logger

  // For the game preparation visual to be shown
  public startCountdownInterval: Delayed

  // This is the time elapsed for the game per cycle
  public gameTimeInterval: Delayed

  constructor(private readonly prismaService: PrismaService) {
    super()
    this.logger = new Logger('SoloRoom')
  }

  // When room is initialized
  async onCreate(data: RoomCreateProps) {
    // Set the randomly selected word to the state object's `word` attribute
    const game = await this.prismaService.game.findUnique({
      where: { id: data.gameId },
      select: { Words: true },
    })
    const words = game.Words.map((word) => new Word(word))
    // const randomWord = await this.pickRandomWord()

    // Create a RoomState object
    const roomState = new RoomState({
      word: words[0],
      guessing: false,
      round: 1,
      totalRound: 10,
      time: FIRST_CYCLE_TIME,
      wordCount: 1,
      numberOfPlayers: 1,
      startCountdown: 3,
      words,
    })

    // Set the room's state
    this.setState(roomState)

    // Start game preparation countdown
    this.startCountdown(roomState)
  }

  startCountdown(roomState: RoomState) {
    this.startCountdownInterval = this.clock.setInterval(() => {
      this.state.startCountdown = roomState.startCountdown - 1
    }, 1000)

    this.clock.setTimeout(
      () => {
        this.firstCycle(roomState)
        this.startCountdownInterval.clear()
      },
      (START_COUNTDOWN + 1) * 1000,
    )
  }

  firstCycle(roomState: RoomState) {
    this.gameTimeInterval = this.clock.setInterval(() => {
      this.state.time = roomState.time - 1
    }, 1000)

    this.clock.setTimeout(() => {
      this.state.time = SECOND_CYCLE_TIME
      this.state.word.cues[3].shown = true
      this.gameTimeInterval.clear()
      this.secondCycle(roomState)
    }, FIRST_CYCLE_TIME * 1000)
  }

  secondCycle(roomState: RoomState) {
    this.gameTimeInterval = this.clock.setInterval(() => {
      this.state.time = roomState.time - 1
    }, 1000)

    this.clock.setTimeout(() => {
      this.state.time = THIRD_CYCLE_TIME
      this.state.word.cues[4].shown = true
      this.gameTimeInterval.clear()
      this.thirdCycle(roomState)
    }, SECOND_CYCLE_TIME * 1000)
  }

  thirdCycle(roomState: RoomState) {
    this.gameTimeInterval = this.clock.setInterval(() => {
      this.state.time = roomState.time - 1
    }, 1000)

    this.clock.setTimeout(() => {
      this.gameTimeInterval.clear()
    }, THIRD_CYCLE_TIME * 1000)
  }

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
