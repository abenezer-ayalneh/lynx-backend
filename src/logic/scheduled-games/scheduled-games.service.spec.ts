import { Test, TestingModule } from '@nestjs/testing'
import ScheduledGamesService from './scheduled-games.service'

describe('ScheduledGamesService', () => {
  let service: ScheduledGamesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScheduledGamesService],
    }).compile()

    service = module.get<ScheduledGamesService>(ScheduledGamesService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
