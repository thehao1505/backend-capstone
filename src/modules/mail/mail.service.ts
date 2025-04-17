import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(to: string, subject: string, text: string) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        text,
      })
      return 'Email sent successfully!'
    } catch (error) {
      throw new Error(`Email sending failed: ${error.message}`)
    }
  }
}
