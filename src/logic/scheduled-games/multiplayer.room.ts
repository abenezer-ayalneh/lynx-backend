import { Client, Delayed, logger, Room } from 'colyseus'
import { Injectable, Logger } from '@nestjs/common'
import { MapSchema } from '@colyseus/schema'
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
import {
  FIRST_CYCLE_SCORE,
  SECOND_CYCLE_SCORE,
  THIRD_CYCLE_SCORE,
} from './constants/score.constant'
import {
  MAX_PLAYERS_PER_ROOM_LIMIT,
  MAX_ROUNDS_PER_GAME_LIMIT,
} from '../../commons/constants/common.constant'
import { MultiplayerRoomCreateProps } from './types/multiplayer-room-props.type'
import Word from './states/word.state'
import GameService from '../games/games.service'

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

  constructor(
    private readonly prismaService: PrismaService,
    private readonly gameService: GameService,
  ) {
    super()
    this.logger = new Logger('MultiplayerRoom')
  }

  /**
   * Validate client name before joining/creating the room
   * @param playerName
   */
  static async onAuth(playerName: string) {
    if (!playerName) {
      return false
    }

    return { playerName }
  }

  /**
   * Initiate a room and subscribe to the guess message type
   */
  async onCreate(data?: MultiplayerRoomCreateProps) {
    // Create a multiplayer room state and set it as the room's state
    const roomState = new MultiplayerRoomState({
      word: undefined,
      guessing: false,
      round: 0,
      totalRound: MAX_ROUNDS_PER_GAME_LIMIT,
      time: FIRST_CYCLE_TIME,
      cycle: 1,
      waitingCountdownTime: START_COUNTDOWN,
      words: [], // TODO get this from the DB
      gameState: 'START_COUNTDOWN',
      winner: null,
      score: new MapSchema<number>(),
      gameStarted: false,
      gameId: data.gameId,
    })
    this.setState(roomState)

    // Set the maximum number of clients that can connect to the room
    this.maxClients = MAX_PLAYERS_PER_ROOM_LIMIT

    // Set room metadata for when list of rooms is shown to the players
    await this.setMetadata({
      numberOfPlayers: 0,
      totalRounds: MAX_ROUNDS_PER_GAME_LIMIT,
      currentRound: 0,
      numberOfMaxPlayers: MAX_PLAYERS_PER_ROOM_LIMIT,
    })

    // Register(subscribe) to necessary messages/events
    this.registerMessages()

    // Start the game
    await this.startGame()
  }

  /**
   * Triggered when a player successfully joins the room
   */
  async onJoin(client: Client, options: any, auth: { playerName: string }) {
    // Start the session's score as 0
    this.state.score.set(client.sessionId, 0)
    this.state.totalScore.set(client.sessionId, 0)

    // Add unique players into the room's 'players' state
    if (
      !this.state.players.some(
        (joinedPlayer) => joinedPlayer.id === client.sessionId,
      )
    ) {
      this.state.players.push(new Player(client.sessionId, auth.playerName))

      // Increment the number of players by one
      await this.setMetadata({
        ...this.metadata,
        numberOfPlayers: this.metadata.numberOfPlayers + 1,
      })
    }

    logger.info(`Player joined with sessionId: ${client.sessionId}`)
  }

  /**
   *  Triggered when a player leaves the room
   * @param client
   */
  async onLeave(client: Client) {
    const indexToRemove = this.state.players.findIndex(
      (player) => player.id === client.sessionId,
    )
    if (indexToRemove >= 0) {
      this.state.players.splice(indexToRemove, 1)

      // Decrement the number of players by one
      await this.setMetadata({
        ...this.metadata,
        numberOfPlayers: this.metadata.numberOfPlayers - 1,
      })
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
    this.state.score.forEach((_, key) => {
      this.state.score.set(key, 0)
    })
    this.setMetadata({
      ...this.metadata,
      currentRound: this.metadata.currentRound + 1,
    })
    Object.keys(this.state.score).forEach((key) => {
      this.state.score.set(key, 0)
    })
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
    const scheduledGame = await this.prismaService.scheduledGame.findUnique({
      where: { id: this.state.gameId },
    })
    if (scheduledGame) {
      const game = await this.prismaService.game.findFirst({
        where: { scheduled_game_id: scheduledGame.id },
        orderBy: { created_at: 'desc' },
        include: { Words: true },
      })

      // Set the words state variable
      if (game) {
        this.state.words = game.Words.map((word) => new Word(word))
      }

      // Start game preparation countdown
      this.createCountdown(START_COUNTDOWN)
      this.state.gameStarted = true
      await this.setMetadata({
        ...this.metadata,
        currentRound: 1,
      })
    }
  }

  /**
   * Prepare and initiate game restart
   */
  async restartGame() {
    this.state.guessing = false
    this.state.round = 0
    this.state.time = START_COUNTDOWN
    this.state.cycle = 1
    this.state.word = undefined
    this.state.winner = null
    this.state.gameState = 'START_COUNTDOWN'
    this.state.waitingCountdownTime = 3
    this.state.gameStarted = false
    this.state.words = []

    const scheduledGame = await this.prismaService.scheduledGame.findUnique({
      where: { id: this.state.gameId },
    })

    if (scheduledGame) {
      await this.gameService.create(
        { type: 'MULTIPLAYER', scheduledGameId: scheduledGame.id },
        scheduledGame.created_by,
      )
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
      this.addScoreToWinner(client.sessionId)
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

    if (this.state.winner === null && wordBeingGuessed) {
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

    // this.onMessage('start-game', () => this.startGame())

    this.onMessage('start-new-game', () => this.restartGame())

    this.onMessage('guess', (client, message: { guess: string }) =>
      this.guess(client, message),
    )

    this.onMessage('talk', (client, payload) => {
      let preparedAudioData = payload.split(';')
      preparedAudioData[0] = 'data:audio/ogg;'
      preparedAudioData = preparedAudioData[0] + preparedAudioData[1]

      this.broadcast('talk', preparedAudioData, { except: client })
    })
  }

  private addScoreToWinner(sessionId: string) {
    let score: number

    switch (this.state.cycle) {
      case 1:
        score = FIRST_CYCLE_SCORE
        break
      case 2:
        score = SECOND_CYCLE_SCORE
        break
      case 3:
        score = THIRD_CYCLE_SCORE
        break
      default:
        score = 0
    }

    if (this.state.score.has(sessionId)) {
      this.state.score.set(sessionId, score)
    }

    if (this.state.totalScore.has(sessionId)) {
      const currentScore = this.state.totalScore.get(sessionId)
      this.state.totalScore.set(sessionId, currentScore + score)
    }
  }
}
