import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer'
import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { Logger } from '@nestjs/common'
import { MAIL_QUEUE_NAME } from '../../commons/constants/common.constant'

@Processor(MAIL_QUEUE_NAME)
export default class MailConsumer {
  logger = new Logger('MailConsumer')

  constructor(private mailerService: MailerService) {}

  @Process()
  async transcode(job: Job<ISendMailOptions>) {
    const result = await this.mailerService.sendMail(job.data)

    this.logger.verbose({ sendMailResult: result })
  }
}
