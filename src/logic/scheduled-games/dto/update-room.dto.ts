import { PartialType } from '@nestjs/mapped-types'
import CreateMultiplayerRoomDto from './create-multiplayer-room.dto'

export default class UpdateRoomDto extends PartialType(CreateMultiplayerRoomDto) {}
