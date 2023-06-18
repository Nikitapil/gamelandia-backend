import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { IMailConfig } from './types';

@Injectable()
export class MailingService {
  constructor(private mailerService: MailerService) {}

  async sendMail(mailConfig: IMailConfig) {
    await this.mailerService.sendMail({
      ...mailConfig
    });
    return true;
  }
}
