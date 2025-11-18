import { Inject, Injectable } from '@nestjs/common';
import {
  EmailRepository,
  EmailRepositorySymbol,
} from '../domain/repository/email.repository';
import { SendEmailDto } from './dto/request/send-email.dto';
import { EmailSendFailedException } from './exceptions/email-send-failed.exception';

@Injectable()
export class SendEmailUseCase {
  constructor(
    @Inject(EmailRepositorySymbol)
    private readonly emailRepository: EmailRepository,
  ) {}

  async execute(dto: SendEmailDto): Promise<void> {
    const ok = await this.emailRepository.sendEmail(
      dto.email,
      dto.subject,
      dto.message,
    );

    if (!ok) {
      throw new EmailSendFailedException();
    }
  }
}
