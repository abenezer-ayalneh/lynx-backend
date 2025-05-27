import { Controller } from '@nestjs/common'

import MailService from './mail.service'

@Controller('mail')
export default class MailController {
  constructor(private readonly mailService: MailService) {}
}
