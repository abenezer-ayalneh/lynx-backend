import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export default class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
	constructor() {
		super({
			// Configure connection pool limits to prevent memory leaks
			// These settings help prevent connection pool exhaustion
			// Connection pool is configured via DATABASE_URL query parameters:
			// ?connection_limit=10&pool_timeout=20
			// Default Prisma connection pool size is 10, which should be sufficient for a 2GB RAM VPS
		})
	}

	async onModuleInit() {
		await this.$connect()
	}

	async onModuleDestroy() {
		await this.$disconnect()
	}
}
