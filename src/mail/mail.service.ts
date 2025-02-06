import { Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import SendMailDto from './dto/mail.dto'
import { MAIL_QUEUE_NAME } from '../commons/constants/email.constant'

@Injectable()
export default class MailService {
  constructor(@InjectQueue(MAIL_QUEUE_NAME) private mailQueue: Queue) {}

  async sendMail(request: SendMailDto) {
    const queueAddResult = await this.mailQueue.add(request)
    if (queueAddResult.isCompleted) {
      return { code: '200', message: 'Mail added to queue' }
    }

    return { code: '500', message: 'Mail queue adding failed' }
  }
}
