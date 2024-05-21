import { Injectable } from '@nestjs/common'
import * as Buffer from 'buffer'
import { compare, genSalt, hash } from 'bcrypt'
import HashingService from './hashing.service'

@Injectable()
export default class BcryptService implements HashingService {
  async compare(data: string | Buffer, encrypted: string): Promise<boolean> {
    return compare(data, encrypted)
  }

  async hash(data: string | Buffer): Promise<string> {
    const salt = await genSalt()
    return hash(data, salt)
  }
}
