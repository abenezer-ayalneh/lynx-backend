import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import CreateGameDto from './dto/create-game.dto'
import GameService from './games.service'
import ActiveUser from '../iam/decorators/active-user.decorator'

@Controller('games')
export default class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  create(
    @Body() createGameDto: CreateGameDto,
    @ActiveUser('sub') playerId: string,
  ) {
    return this.gameService.create(createGameDto, +playerId)
  }

  @Get()
  findAll() {
    return this.gameService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gameService.findOne(+id)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gameService.remove(+id)
  }
}
