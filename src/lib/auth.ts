import { PrismaClient } from '@prisma/client'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin } from 'better-auth/plugins'

import SendMailDto from '../mail/dto/mail.dto'

const prisma = new PrismaClient()

let sendMailFn: ((dto: SendMailDto) => Promise<any>) | null = null

export function registerMailSender(fn: (dto: SendMailDto) => Promise<any>) {
	sendMailFn = fn
}

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),
	trustedOrigins: process.env.CORS_ALLOWED_ORIGINS.split(','),
	plugins: [admin()],
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url }) => {
			if (!sendMailFn) {
				console.error('Mail sender not registered — cannot send password reset email')
				return
			}

			await sendMailFn({
				to: [user.email],
				from: process.env.MAIL_FROM || '"No Reply" <lynxman.gamer@gmail.com>',
				subject: 'Reset Your Lynx Password',
				template: './reset-password',
				context: {
					name: user.name,
					resetLink: url,
				},
			})
		},
	},
	user: {
		additionalFields: {
			score: {
				type: 'number',
				required: true,
				defaultValue: 0,
			},
		},
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			prompt: 'select_account',
			redirectURI: `${process.env.APP_URL}/api/auth/callback/google`,
		},
	},
})
