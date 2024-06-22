import { PartialType } from '@nestjs/mapped-types'
import CreateRoomDto from './create-room.dto'

export default class UpdateRoomDto extends PartialType(CreateRoomDto) {}
