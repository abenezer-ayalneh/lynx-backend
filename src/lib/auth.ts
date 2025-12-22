import { PrismaClient } from '@prisma/client'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin, bearer } from 'better-auth/plugins'

const prisma = new PrismaClient()
export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),
	trustedOrigins: process.env.CORS_ALLOWED_ORIGINS.split(','),
	plugins: [admin(), bearer()],
	emailAndPassword: {
		enabled: true,
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
