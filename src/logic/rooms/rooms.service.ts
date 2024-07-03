import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import CreateRoomDto from './dto/create-room.dto'
import UpdateRoomDto from './dto/update-room.dto'
import PrismaService from '../../prisma/prisma.service'

@Injectable()
export default class RoomsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  create(createRoomDto: CreateRoomDto) {
    // TODO generate an appropriate link with a unique string
    const link = `${this.configService.get<string>('APP_URL')}/some-unique-string`
    return this.prismaService.room.create({
      data: { ...createRoomDto, link },
      select: { id: true, room_id: true },
    })
  }

  findAll() {
    return this.prismaService.room.findMany({})
  }

  findOne(id: number) {
    return this.prismaService.room.findUnique({ where: { id } })
  }

  update(id: number, updateRoomDto: UpdateRoomDto) {
    return this.prismaService.room.update({
      where: { id },
      data: updateRoomDto,
    })
  }

  remove(id: number) {
    return this.prismaService.room.update({
      where: { id },
      data: { deleted_at: new Date(), status: false },
    })
  }
}
