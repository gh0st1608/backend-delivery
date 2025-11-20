import { Injectable } from '@nestjs/common';
import { SendEmailUseCase } from '../../application/send-email.application';
import { SQSEvent } from 'aws-lambda';

interface EmailVerificationPayload {
  email: string;
  subject: string;
  message: string;
}

interface EventBridgeDetail {
  name: string;
  payload: EmailVerificationPayload;
}

interface EventBridgeMessageBody {
  version: string;
  id: string;
  'detail-type': string;
  source: string;
  account: string;
  time: string;
  region: string;
  resources: any[];
  detail: EventBridgeDetail;
}

@Injectable()
export class SQSEmailConsumer {
  constructor(private readonly useCase: SendEmailUseCase) {}

  async handle(event: SQSEvent): Promise<void> {
    try {
      for (const record of event.Records) {
        const eventBody: EventBridgeMessageBody = JSON.parse(record.body);

        const payload = eventBody.detail.payload;

        if (!payload) {
          console.error('❌ Payload inválido en SQS record:', eventBody);
          continue;
        }

        await this.useCase.execute({
          email: payload.email,
          subject: payload.subject,
          message: payload.message,
        });
      }
    } catch (error) {
      console.error('❌ Error procesando SQS:', error);
    }
  }
}
