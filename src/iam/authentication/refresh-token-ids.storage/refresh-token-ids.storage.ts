import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

@Injectable()
export default class RefreshTokenIdsStorage implements OnApplicationShutdown {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  onApplicationShutdown(): any {
    return this.cacheManager.reset()
  }

  private getKey(userId: number): string {
    return `user-${userId}`
  }

  async insert(userId: number, tokenId: string): Promise<void> {
    await this.cacheManager.set(this.getKey(userId), tokenId)
  }

  async validate(userId: number, tokenId: string): Promise<boolean> {
    const storedId = await this.cacheManager.get(this.getKey(userId))
    return storedId === tokenId
  }

  async invalidate(userId: number): Promise<void> {
    await this.cacheManager.del(this.getKey(userId))
  }
}
