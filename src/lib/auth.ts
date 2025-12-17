import { PrismaClient } from '@prisma/client'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin } from 'better-auth/plugins'

const prisma = new PrismaClient()
export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),
	trustedOrigins: ['http://localhost:4200'],
	plugins: [admin()],
	emailAndPassword: {
		enabled: true,
	},
	// socialProviders: {
	// 	google: {}
	// },
})
