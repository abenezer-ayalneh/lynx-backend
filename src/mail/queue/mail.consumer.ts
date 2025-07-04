import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer'
import { Job } from 'bull'

import { MAIL_QUEUE_NAME } from '../../commons/constants/email.constant'

@Processor(MAIL_QUEUE_NAME)
export default class MailConsumer {
	logger = new Logger('MailConsumer')

	constructor(private mailerService: MailerService) {}

	@Process()
	async transcode(job: Job<ISendMailOptions>) {
		const result = (await this.mailerService.sendMail(job.data)) as object

		this.logger.verbose({ sendMailResult: result })
	}
}
