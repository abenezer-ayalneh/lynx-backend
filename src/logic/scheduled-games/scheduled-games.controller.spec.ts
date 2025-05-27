import { Test, TestingModule } from '@nestjs/testing'

import ScheduledGamesController from './scheduled-games.controller'
import ScheduledGamesService from './scheduled-games.service'

describe('ScheduledGamesController', () => {
  let controller: ScheduledGamesController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduledGamesController],
      providers: [ScheduledGamesService],
    }).compile()

    controller = module.get<ScheduledGamesController>(ScheduledGamesController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
