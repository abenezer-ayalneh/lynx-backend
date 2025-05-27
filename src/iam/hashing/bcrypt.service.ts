import { Injectable } from '@nestjs/common'
import { compare as bcryptCompare, genSalt, hash } from 'bcrypt'

import HashingService from './hashing.service'

@Injectable()
export default class BcryptService implements HashingService {
  compare(data: string | Buffer, encrypted: string) {
    return bcryptCompare(data, encrypted)
  }

  async hash(data: string | Buffer): Promise<string> {
    const salt = await genSalt()
    return hash(data, salt)
  }
}
