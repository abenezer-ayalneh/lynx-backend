import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import CreateRoomDto from './dto/create-room.dto'
import UpdateRoomDto from './dto/update-room.dto'
import PrismaService from '../../prisma/prisma.service'
import GameService from '../games/games.service'
import MailService from '../../mail/mail.service'

@Injectable()
export default class RoomsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly gameService: GameService,
    private readonly mailService: MailService,
  ) {}

  async create(createRoomDto: CreateRoomDto, playerId: number) {
    // TODO generate an appropriate link with a unique string
    const link = `${this.configService.get<string>('FRONTEND_APP_URL')}/multi/play/${createRoomDto.room_id}`
    const { emails, ...roomPrams } = createRoomDto
    const room = await this.prismaService.room.create({
      data: { ...roomPrams, link },
      select: { id: true, room_id: true },
    })

    await this.gameService.create(
      { type: 'MULTIPLAYER', room_id: room.id },
      playerId,
    )

    if (emails.length > 0) {
      await this.mailService.sendMail({
        to: emails,
        from: this.configService.get('MAIL_FROM'),
        subject: 'Lynx Game Invitation',
        template: './game-invitation',
        context: {
          invitationText: createRoomDto.invite_text,
          gameUrl: link,
        },
      })
    }

    return room
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
