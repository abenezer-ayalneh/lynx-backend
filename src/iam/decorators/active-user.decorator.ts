import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import REQUEST_PLAYER_KEY from '../iam.constants'
import { ActivePlayerData } from '../types/active-player-data.type'

const ActivePlayer = createParamDecorator((field: keyof ActivePlayerData | undefined, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest()
  const player: ActivePlayerData | undefined = request[REQUEST_PLAYER_KEY]
  return field ? player?.[field] : player
})

export default ActivePlayer
