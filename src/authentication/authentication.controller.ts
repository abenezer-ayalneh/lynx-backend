import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Req } from '@nestjs/common'
import { AllowAnonymous, Session, UserSession } from '@thallesp/nestjs-better-auth'
import type { Request as ExpressRequest } from 'express'

import AuthenticationService from './authentication.service'
import SignInDto from './dto/sign-in.dto'
import SignUpDto from './dto/sign-up.dto'

@Controller('authentication')
export default class AuthenticationController {
	logger: Logger
	constructor(private readonly authService: AuthenticationService) {
		this.logger = new Logger('AuthenticationController')
	}

	@AllowAnonymous()
	@Post('sign-up/email')
	signUpWithEmailAndPassword(@Body() signUpDto: SignUpDto) {
		return this.authService.signUpWithEmailAndPassword(signUpDto)
	}

	@AllowAnonymous()
	@HttpCode(HttpStatus.OK)
	@Post('sign-in/email')
	signInWithEmailAndPassword(@Body() signInDto: SignInDto) {
		return this.authService.signInWithEmailAndPassword(signInDto)
	}

	@Post('sign-out')
	signOut(@Req() request: ExpressRequest) {
		return this.authService.signOut(request.headers)
	}

	@Get('get-session')
	getSession(@Session() session: UserSession) {
		return session
	}

	// @HttpCode(HttpStatus.OK)
	// @Post('refresh-token')
	// refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
	// 	return this.authService.refreshTokens(refreshTokenDto)
	// }
	//
	// @Auth(AuthType.Bearer)
	// @Get('check-token')
	// checkToken(@ActiveUser('sub') playerId: string) {
	// 	return this.authService.checkToken(+playerId)
	// }

	// @HttpCode(HttpStatus.OK)
	// @Post('sign-in')
	// async signIn(
	//   @Res({ passthrough: true }) response: Response,
	//   @Body() signInDto: SignInDto,
	// ) {
	//   const accessToken = await this.authService.signIn(signInDto)
	//   response.cookie('accessToken', accessToken, {
	//     secure: true,
	//     httpOnly: true,
	//     sameSite: true,
	//   })
	// }
}
