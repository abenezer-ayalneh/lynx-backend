import { Injectable, NotFoundException } from '@nestjs/common'

import { auth } from '../lib/auth'
import SignInDto from './dto/sign-in.dto'
import SignUpDto from './dto/sign-up.dto'

@Injectable()
export default class AuthenticationService {
	constructor() {}

	async signUpWithEmailAndPassword(signUpDto: SignUpDto) {
		if (signUpDto.password !== signUpDto.confirmPassword) {
			throw Error('Password and confirm password mismatch')
		}
		const { token, user } = await auth.api.signUpEmail({
			body: {
				name: signUpDto.name,
				email: signUpDto.email,
				password: signUpDto.password,
			},
		})

		return { token, user }
	}

	async signInWithEmailAndPassword(signInDto: SignInDto) {
		try {
			const { token, user } = await auth.api.signInEmail({
				body: {
					email: signInDto.email,
					password: signInDto.password,
				},
			})

			return { token, user }
		} catch (e) {
			if (e instanceof Error && e.message.includes('Invalid')) {
				throw new NotFoundException(e.message)
			}
			throw e
		}
	}

	// async generateTokens(player: Player) {
	// 	const refreshTokenId = randomUUID()
	// 	const [accessToken, refreshToken] = await Promise.all([
	// 		this.signToken<Partial<ActivePlayerData>>(player.id, this.jwtConfiguration.accessTokenTtl, { email: player.email }),
	// 		this.signToken<Partial<RefreshTokenData>>(player.id, this.jwtConfiguration.refreshTokenTtl, { refreshTokenId }),
	// 	])
	// 	await this.refreshTokenIdsStorage.insert(player.id, refreshTokenId)
	// 	return { accessToken, refreshToken }
	// }
	//
	// async signToken<T>(playerId: number, expiresIn: number, payload?: T) {
	// 	return this.jwtService.signAsync(
	// 		{
	// 			sub: playerId,
	// 			...payload,
	// 		},
	// 		{
	// 			audience: this.jwtConfiguration.audience,
	// 			issuer: this.jwtConfiguration.issuer,
	// 			secret: this.jwtConfiguration.secret,
	// 			expiresIn,
	// 		},
	// 	)
	// }
	//
	// async refreshTokens(refreshTokenDto: RefreshTokenDto) {
	// 	try {
	// 		const { sub, refreshTokenId } = await this.jwtService.verifyAsync<Pick<ActivePlayerData, 'sub'> & RefreshTokenData>(refreshTokenDto.refreshToken, {
	// 			secret: this.jwtConfiguration.secret,
	// 			audience: this.jwtConfiguration.audience,
	// 			issuer: this.jwtConfiguration.issuer,
	// 		})
	// 		const player = await this.prismaService.player.findFirstOrThrow({
	// 			where: { id: sub },
	// 		})
	//
	// 		const isValid = await this.refreshTokenIdsStorage.validate(player.id, refreshTokenId)
	// 		if (isValid) {
	// 			await this.refreshTokenIdsStorage.invalidate(player.id)
	// 		} else {
	// 			throw new Error('Refresh token is invalid')
	// 		}
	//
	// 		return await this.generateTokens(player)
	// 	} catch (e) {
	// 		if (e instanceof InvalidatedRefreshTokenError) {
	// 			throw new UnauthorizedException('Access denied')
	// 		}
	// 		throw new UnauthorizedException()
	// 	}
	// }
	//
	// async checkToken(playerId: number) {
	// 	return this.prismaService.player.findUnique({
	// 		where: { id: playerId },
	// 		select: {
	// 			id: true,
	// 			email: true,
	// 			name: true,
	// 			status: true,
	// 			score: true,
	// 			role: true,
	// 		},
	// 	})
	// }
}
