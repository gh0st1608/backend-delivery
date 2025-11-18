import { Injectable } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

@Injectable()
export class SesProvider {
  private client = new SESClient({ region: process.env.AWS_REGION });

  async send(to: string, subject: string, body: string): Promise<boolean> {
    try {
      await this.client.send(
        new SendEmailCommand({
          Destination: { ToAddresses: [to] },
          Message: {
            Subject: { Data: subject },
            Body: { Text: { Data: body } },
          },
          Source: process.env.SES_SOURCE_EMAIL!,
        })
      );
      return true;
    } catch (err) {
      console.error('❌ Error SES:', err);
      return false;
    }
  }
}
