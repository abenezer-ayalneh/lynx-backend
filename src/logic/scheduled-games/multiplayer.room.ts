import { Injectable, Logger } from '@nestjs/common'
import { GameType } from '@prisma/client'
import { Client, Delayed, logger, Room } from 'colyseus'

import { MAX_PLAYERS_PER_ROOM_LIMIT } from '../../commons/constants/common.constant'
import {
	FIRST_CYCLE_TIME,
	FOURTH_CYCLE_TIME,
	IDLE_ROOM_AUTO_DISPOSE_TIMEOUT_MILLISECONDS,
	MID_GAME_COUNTDOWN,
	ON_LEAVE_ROOM_AUTO_DISPOSE_TIMEOUT_MILLISECONDS,
	SECOND_CYCLE_TIME,
	START_COUNTDOWN,
	THIRD_CYCLE_TIME,
} from '../../commons/constants/game-time.constant'
import GameService from '../games/games.service'
import { GAME_RESTART_VOTE, GUESS, PAUSE, RESUME, START_GAME, START_NEW_GAME, WRONG_GUESS } from './constants/message.constant'
import { FIRST_CYCLE_SCORE, FOURTH_CYCLE_SCORE, SECOND_CYCLE_SCORE, THIRD_CYCLE_SCORE } from './constants/score.constant'
import { GamePlayStatus, GameState } from './enums/multiplayer-room.enum'
import ScheduledGamesService from './scheduled-games.service'
import MultiplayerRoomState from './states/multiplayer-room.state'
import Player from './states/player.state'
import Score from './states/score.state'
import Word from './states/word.state'
import { MultiplayerRoomJoinDto } from './types/multiplayer-room-props.type'

@Injectable()
export default class MultiplayerRoom extends Room<MultiplayerRoomState> {
	logger: Logger

	/**
	 * For the game preparation visual(s) to be shown
	 */
	public waitingCountdownInterval: Delayed | undefined

	/**
	 * The time elapsed for the game per cycle
	 */
	public gameTimeInterval: Delayed | undefined

	disposeTimeout: ReturnType<typeof setTimeout> | undefined

	constructor(
		private readonly gameService: GameService,
		private readonly scheduledGameService: ScheduledGamesService,
	) {
		super()
		this.logger = new Logger('MultiplayerRoom')
		this.maxClients = MAX_PLAYERS_PER_ROOM_LIMIT
		this.autoDispose = false
	}

	/**
	 * Validate the client name before joining/creating the room
	 * @param playerName
	 */
	static async onAuth(playerName: string) {
		if (!playerName) {
			return false
		}

		return Promise.resolve({ playerName })
	}

	/**
	 * Initiate a room and subscribe to the guess message type
	 */
	onCreate({ startTimeInMilliseconds }: { startTimeInMilliseconds: number }) {
		// Initiate the game room's state
		const multiplayerRoomState = new MultiplayerRoomState()
		this.setState(multiplayerRoomState)

		// Register(subscribe) to necessary messages/events
		this.registerMessages()

		// Dispose the game room `IDLE_ROOM_AUTO_DISPOSE_TIMEOUT_SECONDS` after game start time if no one joined it.
		const autoDisposeTimeInMilliseconds = Math.max(0, startTimeInMilliseconds - new Date().getTime()) + IDLE_ROOM_AUTO_DISPOSE_TIMEOUT_MILLISECONDS
		this.inactivityTimeoutDisposal(autoDisposeTimeInMilliseconds)
		this.logger.debug(`Room will be disposed in ${autoDisposeTimeInMilliseconds} milliseconds if no one joined it.`)
	}

	inactivityTimeoutDisposal(autoDisposeTimeInMilliseconds: number) {
		this.disposeTimeout = setTimeout(() => {
			if (this.state.gameState === GameState.LOBBY) {
				// Game has not started yet, no players in the lobby, initial timeout has elapsed.
				if (this.state.players.length === 0) {
					this.disconnect()
						.then(() => this.logger.debug('Room disposed due to inactivity.'))
						.catch((error) => this.logger.error(error))
				} else {
					// Game has not started yet, players are waiting in the lobby, the initial inactivity timeout has elapsed.
					// Then wait for `ON_LEAVE_ROOM_AUTO_DISPOSE_TIMEOUT_SECONDS` amount and try again.
					this.logger.debug(`Wait for ${ON_LEAVE_ROOM_AUTO_DISPOSE_TIMEOUT_MILLISECONDS} seconds to dispose the room.`)
					this.inactivityTimeoutDisposal(ON_LEAVE_ROOM_AUTO_DISPOSE_TIMEOUT_MILLISECONDS)
				}
			}
		}, autoDisposeTimeInMilliseconds)
	}

	/**
	 * Triggered when a player successfully joins the room
	 */
	onJoin(client: Client, options: MultiplayerRoomJoinDto, auth: { playerName: string }) {
		// Start the session's score as 0.
		this.state.score.set(client.sessionId, 0)
		this.state.totalScore.set(
			client.sessionId,
			new Score({
				id: client.sessionId,
				name: auth.playerName,
				score: 0,
			}),
		)
		this.state.sessionScore.set(
			client.sessionId,
			new Score({
				id: client.sessionId,
				name: auth.playerName,
				score: 0,
			}),
		)

		// Add unique players into the room's 'players' state
		if (!this.state.players.some((joinedPlayer) => joinedPlayer.id === client.sessionId)) {
			this.state.players.push(new Player(client.sessionId, auth.playerName))
		}

		logger.debug(`Player joined with sessionId: ${client.sessionId}`)
	}

	/**
	 *  Triggered when a player leaves the room
	 * @param client
	 */
	onLeave(client: Client) {
		// If the game has been played and when the last player leaves the room, wait for `ON_LEAVE_ROOM_AUTO_DISPOSE_TIMEOUT_SECONDS` number of seconds
		// and then dispose the game room.
		if (this.state.gameState !== GameState.LOBBY && this.state.players.length === 1) {
			this.disposeTimeout = setTimeout(() => {
				this.disconnect()
					.then(() => this.logger.debug('Room disposed when last player left.'))
					.catch((error) => this.logger.error(error))
			}, ON_LEAVE_ROOM_AUTO_DISPOSE_TIMEOUT_MILLISECONDS)
			this.logger.debug(`Room will be disposed in ${ON_LEAVE_ROOM_AUTO_DISPOSE_TIMEOUT_MILLISECONDS} milliseconds after the last player left.`)
		}

		this.state.removePlayer(client.sessionId)
	}

	onDispose(): void {
		this.logger.debug('ROOM DISPOSED')
	}

	/**
	 * Initiate a room and subscribe to the guess message type
	 */
	startGame(scheduledGameId: string, ownerId: number) {
		// Configure initial states to start playing the multiplayer game
		this.gameService
			.create({ type: GameType.MULTIPLAYER, scheduledGameId }, ownerId)
			.then(() => {
				this.state.time = FIRST_CYCLE_TIME
				this.state.cycle = 1
				this.state.waitingCountdownTime = START_COUNTDOWN
				this.state.words = []
				this.state.gameState = GameState.START_COUNTDOWN
				this.state.winner = null

				// Start the game
				this.initiateGame(scheduledGameId)
					.then(() => this.logger.debug('Multiplayer game started'))
					.catch((error) => this.logger.error(error))
			})
			.catch((error) => this.logger.error(error))
	}

	/**
	 * Delayed countdown
	 * @param timeoutTime
	 */
	startRoundWithCountdown(timeoutTime: number) {
		this.waitingCountdownInterval = this.clock.setInterval(() => {
			this.state.waitingCountdownTime -= 1
		}, 1000)

		this.clock.setTimeout(
			() => {
				this.state.gameState = GameState.GAME_STARTED
				this.firstCycle()
				this.clearInterval(this.waitingCountdownInterval)
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

		this.gameTimeInterval = this.clock.setInterval(() => {
			this.state.time -= 1

			if (this.state.time <= 0) {
				this.state.time = SECOND_CYCLE_TIME
				this.state.word.cues[2].shown = true
				this.clearInterval(this.gameTimeInterval)
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
				this.clearInterval(this.gameTimeInterval)
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
		this.gameTimeInterval = this.clock.setInterval(() => {
			this.state.time -= 1

			if (this.state.time <= 0) {
				this.state.time = FOURTH_CYCLE_TIME
				this.state.word.cues[4].shown = true
				this.clearInterval(this.gameTimeInterval)
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
		this.gameTimeInterval = this.clock.setInterval(() => {
			this.state.time -= 1

			if (this.state.time <= 0) {
				this.stopCurrentRoundOrGame()
				this.clearInterval(this.gameTimeInterval)
			}
		}, 1000)
	}

	/**
	 * Prepare the necessary steps needed for a multiplayer game to start
	 */
	async initiateGame(scheduledGameId: string) {
		// Fetch the associated game with the current game
		const scheduledGame = await this.scheduledGameService.getById(scheduledGameId)
		if (scheduledGame) {
			const game = await this.gameService.findFirstByScheduledGameId(scheduledGame.id)

			// Set the words state variable
			if (game) {
				this.state.words = game.Words.map((word) => new Word(word))

				// Start game preparation countdown
				this.startRoundWithCountdown(START_COUNTDOWN)
			}
		}
	}

	/**
	 * Prepare and initiate game restart
	 */
	restartGame(scheduledGameId: string, ownerId: number) {
		this.state.round = 0
		this.state.time = START_COUNTDOWN
		this.state.cycle = 1
		this.state.word = undefined
		this.state.winner = null
		this.state.gameState = GameState.START_COUNTDOWN
		this.state.waitingCountdownTime = 3
		this.state.words = []
		this.state.clearScore()
		this.state.clearTotalScore()

		this.gameService
			.create({ type: 'MULTIPLAYER', scheduledGameId }, ownerId)
			.then(() => this.initiateGame(scheduledGameId))
			.catch((error) => this.logger.error(error))
	}

	/**
	 * Handle the guess message
	 * @param client
	 * @param message
	 * @private
	 */
	guess(client: Client, message: { guess: string }) {
		const isWinner = this.checkForWinner(message.guess)

		if (isWinner) {
			this.state.setWinner({
				id: client.sessionId,
				name: this.state.players.find((player) => player.id === client.sessionId).name,
				score: this.getPlayerScore(),
			})
			this.addScoreToWinner(client.sessionId)
			this.stopCurrentRoundOrGame()
		} else {
			client.send(WRONG_GUESS, { guess: false })
		}
	}

	/**
	 * To put the currently running round or game to halt based on some conditions
	 * @private
	 */
	private stopCurrentRoundOrGame() {
		this.state.gameState = GameState.ROUND_END
		this.state.waitingCountdownTime = MID_GAME_COUNTDOWN
		this.clearInterval(this.gameTimeInterval)

		// Game is not done but the current round is.
		if (this.state.words.length > this.state.round) {
			this.startRoundWithCountdown(MID_GAME_COUNTDOWN)
		} else {
			this.waitingCountdownInterval = this.clock.setInterval(() => {
				this.state.waitingCountdownTime -= 1

				if (this.state.waitingCountdownTime <= 0) {
					this.state.gameState = GameState.GAME_END
					this.state.time = 0
					this.state.word = undefined
					this.clearInterval(this.waitingCountdownInterval)
				}
			}, 1000)
		}
	}

	/**
	 * Check if the guessed word matches the currently being played word's key
	 * @param guess
	 * @private
	 */
	private checkForWinner(guess: string) {
		// Get the currently being played word
		const wordBeingGuessed = this.state.word

		if (this.state.gameState === GameState.GAME_STARTED && this.state.winner === null && wordBeingGuessed) {
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
		this.onMessage(
			START_GAME,
			(
				_,
				message: {
					scheduledGameId: string
					ownerId: string
				},
			) => this.startGame(message.scheduledGameId, Number(message.ownerId)),
		)

		this.onMessage(PAUSE, () => this.pauseGame())

		this.onMessage(RESUME, () => this.resumeGame())

		this.onMessage(
			START_NEW_GAME,
			(
				_,
				message: {
					scheduledGameId: string
					ownerId: string
				},
			) => this.restartGame(message.scheduledGameId, Number(message.ownerId)),
		)

		this.onMessage(GUESS, (client, message: { guess: string }) => this.guess(client, message))

		this.onMessage(GAME_RESTART_VOTE, (client, message: { vote: boolean }) => {
			this.state.voteForGameRestart(client.sessionId, message.vote)
		})
	}

	private addScoreToWinner(sessionId: string) {
		const score = this.getPlayerScore()

		if (this.state.score.has(sessionId)) {
			this.state.score.set(sessionId, score)
		}

		if (this.state.totalScore.has(sessionId)) {
			this.state.totalScore.get(sessionId).incrementScore(score)
		}

		if (this.state.sessionScore.has(sessionId)) {
			this.state.sessionScore.get(sessionId).incrementScore(score)
		}
	}

	private getPlayerScore() {
		switch (this.state.cycle) {
			case 1:
				return FIRST_CYCLE_SCORE
			case 2:
				return SECOND_CYCLE_SCORE
			case 3:
				return THIRD_CYCLE_SCORE
			case 4:
				return FOURTH_CYCLE_SCORE
			default:
				return 0
		}
	}

	private pauseGame() {
		this.waitingCountdownInterval?.pause()
		this.gameTimeInterval?.pause()
		this.clock.stop()
		this.state.gamePlayStatus = GamePlayStatus.PAUSED
	}

	private resumeGame() {
		this.waitingCountdownInterval?.resume()
		this.gameTimeInterval?.resume()
		this.clock.start()
		this.state.gamePlayStatus = GamePlayStatus.PLAYING
	}

	private clearInterval(interval: Delayed | undefined | null) {
		if (interval) {
			interval.clear()
		}
	}
}
