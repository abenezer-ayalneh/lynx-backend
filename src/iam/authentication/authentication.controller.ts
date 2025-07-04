import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common'

import ActiveUser from '../decorators/active-user.decorator'
import AuthenticationService from './authentication.service'
import { Auth } from './decorators/auth.decorator'
import RefreshTokenDto from './dto/refresh-token.dto'
import SignInDto from './dto/sign-in.dto/sign-in.dto'
import SignUpDto from './dto/sign-up.dto/sign-up.dto'
import AuthType from './enums/auth-type.enum'

@Auth(AuthType.None)
@Controller('authentication')
export default class AuthenticationController {
	constructor(private readonly authService: AuthenticationService) {}

	@Post('sign-up')
	signUp(@Body() signUpDto: SignUpDto) {
		return this.authService.signUp(signUpDto)
	}

	@HttpCode(HttpStatus.OK)
	@Post('sign-in')
	signIn(@Body() signInDto: SignInDto) {
		return this.authService.signIn(signInDto)
	}

	@HttpCode(HttpStatus.OK)
	@Post('refresh-token')
	refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
		return this.authService.refreshTokens(refreshTokenDto)
	}

	@Auth(AuthType.Bearer)
	@Get('check-token')
	checkToken(@ActiveUser('sub') playerId: string) {
		return this.authService.checkToken(+playerId)
	}

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
