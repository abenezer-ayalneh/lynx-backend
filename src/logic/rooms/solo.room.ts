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

@Injectable()
export default class SoloRoom extends Room<RoomState> {
  logger: Logger

  // For the game preparation visual to be shown
  public startCountdownInterval: Delayed

  // This is the time elapsed for the game per cycle
  public gameTimeInterval: Delayed

  // Word IDs that have already been picked
  private alreadyPickedWordIds: number[] = []

  constructor(private readonly prismaService: PrismaService) {
    super()
    this.logger = new Logger('LogicRoom')
  }

  // When room is initialized
  async onCreate() {
    // Create a RoomState object
    const roomState = new RoomState()

    // Set the randomly selected word to the state object's `word` attribute
    roomState.word = await this.pickRandomWord()

    // Set the room's state
    this.setState(roomState)

    // Start game preparation countdown
    this.startCountdown(roomState)
  }

  /**
   * Pick a selected amount of random rows from the `words` table
   */
  async pickRandomWord(): Promise<Word> {
    const wordsCount = await this.prismaService.word.count()
    const skip = Math.max(0, Math.floor(Math.random() * wordsCount) - 1)
    const fields = [
      'id',
      'key',
      'cue_word_1',
      'cue_word_2',
      'cue_word_3',
      'cue_word_4',
      'cue_word_5',
    ]
    const sortDirection = ['asc', 'desc']
    const orderBy = fields[Math.floor(Math.random() * fields.length)]
    const orderDir =
      sortDirection[Math.floor(Math.random() * sortDirection.length)]

    const pickedWords = await this.prismaService.word.findMany({
      where: {
        id: {
          notIn: this.alreadyPickedWordIds,
        },
      },
      take: 1,
      skip,
      orderBy: { [orderBy]: orderDir },
    })

    if (pickedWords.length > 0) {
      const pickedWord = new Word(pickedWords[0])
      this.alreadyPickedWordIds.push(pickedWord.id)

      return pickedWord
    }

    return null
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
