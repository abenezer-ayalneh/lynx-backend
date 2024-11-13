import { Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { ConfigService } from '@nestjs/config'
import SendMailDto from './dto/mail.dto'
import { MAIL_QUEUE_NAME } from '../commons/constants/common.constant'

@Injectable()
export default class MailService {
  constructor(
    @InjectQueue(MAIL_QUEUE_NAME) private mailQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async sendMail(request: SendMailDto) {
    // if (Array.isArray(request.to) && request.to.length > 0) {
    //   request.to.forEach((emailTo) => {
    //     const mailBody = {
    //       to: emailTo,
    //       from: this.configService.get('MAIL_FROM'),
    //       subject: 'Lynx Game Invitation',
    //       template: './game-invitation',
    //       context: {
    //         invitationText: request.invitationText,
    //         gameUrl: 'https://example.com', // TODO put an actual game URL here
    //       },
    //     }
    //
    //     this.mailQueue.add(mailBody)
    //   })
    // }

    const queueAddResult = await this.mailQueue.add(request)
    if (queueAddResult.isCompleted) {
      return { code: '200', message: 'Mail added to queue' }
    }

    return { code: '500', message: 'Mail queue adding failed' }
  }
}
