import { Injectable } from '@nestjs/common'

@Injectable()
export default class AuthService {
	constructor() {}

	// async signUpWithEmailAndPassword(signUpDto: SignUpDto) {
	// 	if (signUpDto.password !== signUpDto.confirmPassword) {
	// 		throw Error('Password and confirm password mismatch')
	// 	}
	// 	const { token, user } = await auth.api.signUpEmail({
	// 		body: {
	// 			name: signUpDto.name,
	// 			email: signUpDto.email,
	// 			password: signUpDto.password,
	// 		},
	// 	})
	//
	// 	return { token, user }
	// }
	//
	// async signInWithEmailAndPassword(signInDto: SignInDto) {
	// 	return auth.api.signInEmail({
	// 		body: {
	// 			email: signInDto.email,
	// 			password: signInDto.password,
	// 		},
	// 	})
	// }
	//
	// signOut(headers: IncomingHttpHeaders) {
	// 	return auth.api.signOut({ headers: fromNodeHeaders(headers) })
	// }
}
