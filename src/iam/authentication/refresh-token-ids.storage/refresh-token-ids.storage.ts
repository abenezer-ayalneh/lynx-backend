import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common'
import { Cache } from 'cache-manager'

@Injectable()
export default class RefreshTokenIdsStorage implements OnApplicationShutdown {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  onApplicationShutdown(): any {
    return this.cacheManager.clear()
  }

  private getKey(playerId: number): string {
    return `player-${playerId}`
  }

  async insert(playerId: number, tokenId: string): Promise<void> {
    await this.cacheManager.set(this.getKey(playerId), tokenId)
  }

  async validate(playerId: number, tokenId: string): Promise<boolean> {
    const storedId = await this.cacheManager.get(this.getKey(playerId))
    return storedId === tokenId
  }

  async invalidate(playerId: number): Promise<void> {
    await this.cacheManager.del(this.getKey(playerId))
  }
}
