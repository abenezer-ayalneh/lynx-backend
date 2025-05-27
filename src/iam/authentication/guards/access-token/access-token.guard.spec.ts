import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { Player } from '@prisma/client'

import jwtConfig from '../../../config/jwt.config'
import REQUEST_PLAYER_KEY from '../../../iam.constants'
import AccessTokenGuard from './access-token.guard'

describe('AccessTokenGuard', () => {
  let accessTokenGuard: AccessTokenGuard
  const mockPlayer = {
    id: 1,
    email: 'john.doe@gmail.com',
    password: 'hashedPassword',
  } as Player
  const mockJwtService = {
    verifyAsync: jest.fn().mockReturnValue(mockPlayer),
  }
  const mockJwtConfiguration = {
    secret: '33MDF2rsjXjnuguK4wiv7TORMJimHLdgiOBupn0r5IfhVQ6K',
    audience: 'http://localhost:3000',
    issuer: 'http://localhost:3000',
    accessTokenTtl: parseInt('3600', 10),
    refreshTokenTtl: parseInt('86400', 10),
  }

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AccessTokenGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: jwtConfig.KEY,
          useValue: mockJwtConfiguration,
        },
      ],
    }).compile()

    accessTokenGuard = moduleRef.get<AccessTokenGuard>(AccessTokenGuard)
  })

  it('should be defined', () => {
    expect(accessTokenGuard).toBeDefined()
  })

  /**
   * Test for the following
   * 1. Normal flow where token is available, and it is valid
   * 2. Token is not provided with request
   * 3. Token is provided but is invalid
   */
  it('canActivate => should return true if token is available, and it is valid', async () => {
    // Arrange
    const mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
      player: undefined,
    }
    const executionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext

    // Act
    const result = await accessTokenGuard.canActivate(executionContext)

    // Assert
    expect.assertions(3)
    expect(result).toBe(true)
    expect(mockRequest[REQUEST_PLAYER_KEY]).toBeDefined()
    expect(mockRequest[REQUEST_PLAYER_KEY]).toBe(mockPlayer)
  })

  it('canActivate => should throw UnauthorizedException if token is not available', async () => {
    // Arrange
    const executionContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as ExecutionContext

    // Act & Assert
    expect.assertions(1)
    await expect(accessTokenGuard.canActivate(executionContext)).rejects.toThrow(UnauthorizedException)
  })

  it('canActivate => should throw UnauthorizedException if token is invalid', async () => {
    // Arrange
    mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'))
    const executionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer invalid-token' },
        }),
      }),
    } as ExecutionContext

    // Act & Assert
    expect.assertions(1)
    await expect(accessTokenGuard.canActivate(executionContext)).rejects.toThrow(UnauthorizedException)
  })
})
