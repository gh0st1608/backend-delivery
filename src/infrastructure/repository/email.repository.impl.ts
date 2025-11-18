import { Injectable } from '@nestjs/common';
import { EmailRepository } from '../../domain/repository/email.repository';
import { SesProvider } from '../provider/ses.provider';

@Injectable()
export class EmailRepositoryImpl implements EmailRepository {
  constructor(private readonly ses: SesProvider) {}

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    return this.ses.send(to, subject, body);
  }
}
