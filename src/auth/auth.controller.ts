import { All, Controller, Logger } from '@nestjs/common'
import { toNodeHandler } from 'better-auth/node'

import { auth } from '../lib/auth'
import AuthService from './auth.service'

@Controller('auth')
export default class AuthController {
	logger: Logger
	constructor(private readonly authService: AuthService) {
		this.logger = new Logger('AuthController')
	}

	@All('/*splat')
	handleAuth() {
		return toNodeHandler(auth)
	}

	// @AllowAnonymous()
	// @Post('sign-up/email')
	// signUpWithEmailAndPassword(@Body() signUpDto: SignUpDto) {
	// 	return this.authService.signUpWithEmailAndPassword(signUpDto)
	// }
	//
	// @AllowAnonymous()
	// @HttpCode(HttpStatus.OK)
	// @Post('sign-in/email')
	// signInWithEmailAndPassword(@Body() signInDto: SignInDto) {
	// 	return this.authService.signInWithEmailAndPassword(signInDto)
	// }
	//
	// @Post('sign-out')
	// signOut(@Req() request: ExpressRequest) {
	// 	return this.authService.signOut(request.headers)
	// }
	//
	// @Get('get-session')
	// getSession(@Session() session: UserSession) {
	// 	return session
	// }

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
