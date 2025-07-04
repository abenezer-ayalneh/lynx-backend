import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema'

import { MAX_ROUNDS_PER_GAME_LIMIT } from '../../../commons/constants/common.constant'
import { GamePlayStatus, GameState } from '../enums/multiplayer-room.enum'
import { Score as WinnerType } from '../types/winner.type'
import Player from './player.state'
import Score from './score.state'
import Word from './word.state'

export default class MultiplayerRoomState extends Schema {
	// @type('number') gameId: number // The scheduled game's ID.
	//
	// @type('number') ownerId: number // The ID of the player who created this game.
	//
	// @type('string') startTime: string // The scheduled game's start time.

	@type([Player]) players = new ArraySchema<Player>() // Players currently available in the game room.

	@type('number') round: number // Currently being played round.

	@type('number') totalRound: number // Total number of rounds.

	@type('number') time: number // The countdown time currently being displayed.

	@type('number') cycle: number // The current word's cycle (i.e., how many cue words are displayed after the initial 2).

	@type(Word) word: Word | null // The word row that is currently being played.

	@type('number') waitingCountdownTime: number // Countdown timer for the waiting windows.

	@type('string') gameState: GameState // The state of the current game.

	@type('string') gamePlayStatus: GamePlayStatus // The state the game is currently in.

	@type(Score) winner: Score | null // The winner.

	@type({ map: 'number' }) score = new MapSchema<number>() // Scores of the players (key is ID and value is score).

	@type({ map: Score }) totalScore = new MapSchema<Score>() // Total scores of the players (key is player session ID, and value is total score).

	@type({ map: Score }) sessionScore = new MapSchema<Score>() // Total score summation of the players within one game session (key is player session ID, and value is total score).

	words: Word[] // All the words selected for this game.

	constructor() {
		super()

		this.round = 0
		this.time = 0
		this.cycle = 0
		this.word = null
		this.waitingCountdownTime = 0
		this.gameState = GameState.LOBBY
		this.gamePlayStatus = GamePlayStatus.PLAYING
		this.winner = null
		this.totalRound = MAX_ROUNDS_PER_GAME_LIMIT
	}

	/**
	 * Sets the winner of the game by creating a new Winner instance with the provided winner data.
	 *
	 * @param {WinnerType} winner - The data representing the winner.
	 * @return {void} No return value.
	 */
	setWinner(winner: WinnerType): void {
		this.winner = new Score(winner)
	}

	/**
	 * Resets all the scores in the score map to zero.
	 *
	 * @return {void} Does not return a value.
	 */
	clearScore(): void {
		this.score.forEach((_, key) => {
			this.score.set(key, 0)
		})
	}

	/**
	 * Resets the total score of all winners by setting their score to 0.
	 *
	 * @return {void} Does not return a value.
	 */
	clearTotalScore(): void {
		this.totalScore.forEach((winner, key) => {
			this.totalScore.set(key, new Score({ ...winner, score: 0 }))
		})
	}

	/**
	 * Records a player's vote for restarting the game.
	 *
	 * @param sessionId
	 * @param {boolean} vote - A boolean indicating the player's vote.
	 *                         Pass `true` to vote for a restart, or `false` against it.
	 * @return {void} - Does not return a value.
	 */
	voteForGameRestart(sessionId: string, vote: boolean): void {
		if (this.totalScore.has(sessionId)) {
			const restartGameVote = this.totalScore.get(sessionId)
			restartGameVote.voteForRestart(vote)
		}
	}
}
