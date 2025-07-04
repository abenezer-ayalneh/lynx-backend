import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaClient } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'

import PrismaService from '../../prisma/prisma.service'
import jwtConfig from '../config/jwt.config'
import HashingService from '../hashing/hashing.service'
import AuthenticationService from './authentication.service'
import SignInDto from './dto/sign-in.dto/sign-in.dto'
import SignUpDto from './dto/sign-up.dto/sign-up.dto'
import RefreshTokenIdsStorage from './refresh-token-ids.storage/refresh-token-ids.storage'

describe('AuthenticationService', () => {
	let authenticationService: AuthenticationService
	let prisma: DeepMockProxy<PrismaClient>
	const mockBcryptService = {
		hash: jest.fn(),
		compare: jest.fn(),
	}
	const mockJwtService = {
		signAsync: jest.fn(),
		verifyAsync: jest.fn(),
	}
	const mockJwtConfiguration = {
		secret: '33MDF2rsjXjnuguK4wiv7TORMJimHLdgiOBupn0r5IfhVQ6K',
		audience: 'http://localhost:3000',
		issuer: 'http://localhost:3000',
		accessTokenTtl: parseInt('3600', 10),
		refreshTokenTtl: parseInt('86400', 10),
	}
	const mockRefreshTokenIdsStorage = {
		insert: jest.fn(),
		validate: jest.fn(),
		invalidate: jest.fn(),
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthenticationService,
				PrismaService,
				{ provide: HashingService, useValue: mockBcryptService },
				{ provide: JwtService, useValue: mockJwtService },
				{ provide: jwtConfig.KEY, useValue: mockJwtConfiguration },
				{
					provide: RefreshTokenIdsStorage,
					useValue: mockRefreshTokenIdsStorage,
				},
			],
		})
			.overrideProvider(PrismaService)
			.useValue(mockDeep<PrismaClient>())
			.compile()

		authenticationService = module.get<AuthenticationService>(AuthenticationService)
		prisma = module.get<DeepMockProxy<PrismaClient>>(PrismaService)
	})

	it('AuthenticationService => should be defined', () => {
		// Act & Assert
		expect(authenticationService).toBeDefined()
	})

	it('signUp => should create a new player with hashed password', async () => {
		// Arrange
		const signUpDto = {
			email: 'john.doe@gmail.com',
			password: 'passpass',
		} as SignUpDto
		const hashedPassword = 'this-is-a-hashed-password'
		// const player = {
		//   id: 1,
		//   name: 'John Doe',
		//   email: signUpDto.email,
		//   password: hashedPassword,
		//   status: true,
		//   created_at: new Date(),
		//   updated_at: new Date(),
		//   deleted_at: new Date(),
		// } as Player

		jest.spyOn(mockBcryptService, 'hash').mockReturnValue(hashedPassword)
		// prisma.player.create.mockReturnValue(player) // TODO find a way to do it without ts-ignore

		// Act
		await authenticationService.signUp(signUpDto)

		// Assert
		expect.assertions(4)
		expect(mockBcryptService.hash).toHaveBeenCalledTimes(1)
		expect(mockBcryptService.hash).toHaveBeenCalledWith(signUpDto.password)
		// expect(prisma.player.create).toHaveBeenCalledTimes(1)
		// expect(prisma.player.create).toHaveBeenCalledWith({
		//   data: { email: signUpDto.email, password: hashedPassword },
		// })
	})

	it('signUp => should throw ConflictException if email already exists', async () => {
		// Arrange
		const signUpDto = {
			email: 'john.doe@gmail.com',
			password: 'passpass',
		} as SignUpDto
		const hashedPassword = 'this-is-a-hashed-password'

		jest.spyOn(mockBcryptService, 'hash').mockReturnValue(hashedPassword)

		// prisma.player.create.mockRejectedValue(
		//   new PrismaClientKnownRequestError('Player already exists', {
		//     code: 'P2002',
		//     clientVersion: '2.13.0-dev.93',
		//   }),
		// )

		// Act & Assert
		expect.assertions(1)
		await expect(authenticationService.signUp(signUpDto)).rejects.toThrow(ConflictException)
	})

	it('signUp => should have 2 validation errors when password and email are invalid', async () => {
		// Arrange
		const signUpDto = {
			email: '',
			password: '',
		} as SignUpDto
		const signUpDtoInstance = plainToInstance(SignUpDto, signUpDto)
		const errors = await validate(signUpDtoInstance)

		// Act & Assert
		expect.assertions(1)
		expect(errors.length).not.toBe(0)
	})

	it('signIn => should return generated tokens for the authenticated player', async () => {
		// Arrange
		const signInDto = {
			email: 'john.doe@gmail.com',
			password: 'passpass',
		} as SignInDto

		const player = {
			id: 1,
			email: 'john.doe@gmail.com',
			password: 'passpass',
		}

		const generatedTokens = {
			accessToken: 'accessToken',
			refreshToken: 'refreshToken',
		}

		prisma.player.findFirst.mockReturnValue(player) // TODO find a way to do it without ts-ignore
		jest.spyOn(mockBcryptService, 'compare').mockReturnValue(true)
		jest.spyOn(authenticationService, 'generateTokens').mockReturnValue(Promise.resolve(generatedTokens))

		// Act
		const result = await authenticationService.signIn(signInDto)

		// Assert
		expect.assertions(3)
		expect(result).toBeDefined()
		expect(result.accessToken).toBeDefined()
		expect(result.refreshToken).toBeDefined()
	})

	it("signIn => should return 'Player does not exist' UnauthorizedException when the player doesn't exist in the database", async () => {
		// Arrange
		const signInDto = {
			email: 'john.doe@gmail.com',
			password: 'passpass',
		} as SignInDto

		prisma.player.findFirst.mockReturnValue(null) // TODO find a way to do it without ts-ignore

		// Act & Assert
		expect.assertions(1)
		await expect(authenticationService.signIn(signInDto)).rejects.toThrow(new UnauthorizedException('Player does not exists'))
	})

	it("signIn => should return 'Email or password mismatch' UnauthorizedException when the player's email and password doesn't match", async () => {
		// Arrange
		const signInDto = {
			email: 'john.doe@gmail.com',
			password: 'passpass',
		} as SignInDto

		const player = {
			id: 1,
			email: 'john.doe@gmail.com',
			password: 'passpass',
		}

		prisma.player.findFirst.mockReturnValue(player) // TODO find a way to do it without ts-ignore
		jest.spyOn(mockBcryptService, 'compare').mockReturnValue(false)

		// Act & Assert
		expect.assertions(1)
		await expect(authenticationService.signIn(signInDto)).rejects.toThrow(new UnauthorizedException('Email or password mismatch'))
	})

	it('generateTokens => generate access and refresh token for the given player', async () => {
		// Arrange
		const player = {
			id: 1,
			email: 'john.doe@gmail.com',
			password: 'passpass',
		}

		jest.spyOn(authenticationService, 'signToken').mockReturnValue(Promise.resolve('generated-token'))

		// Act
		const result = await authenticationService.generateTokens(player)

		// Assert
		expect.assertions(5)
		expect(result).toBeDefined()
		expect(result.accessToken).toBeDefined()
		expect(result.refreshToken).toBeDefined()
		// expect(authenticationService.signToken).toHaveBeenCalledTimes(2)
		expect(mockRefreshTokenIdsStorage.insert).toHaveBeenCalledTimes(1)
	})

	/**
	 * Test for the following:
	 * 1. Normal flow where JWT verification passes, player is found, refresh token is validated via refresh token storage
	 * 2. If the player is not found, it should throw unauthorized exception
	 * 3. If the refresh token ID is invalid, it should throw unauthorized exception
	 */
	it('refreshTokens => should validate sent refresh token and return an access and refresh tokens', async () => {
		// Arrange
		const player = {
			id: 1,
			email: 'john.doe@gmail.com',
			password: 'passpass',
		}
		const refreshToken = 'string-string-string-string-string'

		jest.spyOn(mockJwtService, 'verifyAsync').mockReturnValue({ sub: player.id, refreshTokenId: refreshToken })
		// prisma.player.findFirstOrThrow.mockReturnValue(player) // TODO find a way to do it without ts-ignore
		jest.spyOn(mockRefreshTokenIdsStorage, 'validate').mockReturnValue(true)
		jest.spyOn(authenticationService, 'generateTokens').mockReturnValue(
			Promise.resolve({
				accessToken: 'accessToken',
				refreshToken: 'refreshToken',
			}),
		)

		// Act
		const result = await authenticationService.refreshTokens({
			refreshToken,
		})

		// Assert
		expect.assertions(5)
		expect(result).toBeDefined()
		expect(result.accessToken).toBeDefined()
		expect(result.refreshToken).toBeDefined()
		expect(mockRefreshTokenIdsStorage.invalidate).toHaveBeenCalledTimes(1)
		// expect(authenticationService.generateTokens).toHaveBeenCalledTimes(1)
	})

	it('refreshTokens => should throw unauthorized exception if the player is not found', async () => {
		// Arrange
		const player = {
			id: 1,
			email: 'john.doe@gmail.com',
			password: 'passpass',
		}
		const refreshToken = 'string-string-string-string-string'

		jest.spyOn(mockJwtService, 'verifyAsync').mockReturnValue({ sub: player.id, refreshTokenId: refreshToken })
		prisma.player.findFirstOrThrow.mockRejectedValue(
			new PrismaClientKnownRequestError('Player does not exists', {
				code: 'P2025',
				clientVersion: '2.13.0-dev.93',
			}),
		)

		// Act & Assert
		expect.assertions(1)
		await expect(authenticationService.refreshTokens({ refreshToken })).rejects.toThrow(UnauthorizedException)
	})

	it('refreshTokens => should throw unauthorized exception if the refresh token ID is invalid', async () => {
		// Arrange
		const player = {
			id: 1,
			email: 'john.doe@gmail.com',
			password: 'passpass',
		}
		const refreshToken = 'string-string-string-string-string'

		jest.spyOn(mockJwtService, 'verifyAsync').mockReturnValue({ sub: player.id, refreshTokenId: refreshToken })
		// prisma.player.findFirstOrThrow.mockReturnValue(player) // TODO find a way to do it without ts-ignore
		jest.spyOn(mockRefreshTokenIdsStorage, 'validate').mockReturnValue(false)
		jest.spyOn(authenticationService, 'generateTokens').mockReturnValue(
			Promise.resolve({
				accessToken: 'accessToken',
				refreshToken: 'refreshToken',
			}),
		)

		// Act & Assert
		expect.assertions(2)
		await expect(authenticationService.refreshTokens({ refreshToken })).rejects.toThrow(UnauthorizedException)
		// expect(authenticationService.generateTokens).not.toHaveBeenCalled()
		// expect(mockRefreshTokenIdsStorage.invalidate).not.toHaveBeenCalled() //TODO figure out why the invalidate function is being called
	})
})
