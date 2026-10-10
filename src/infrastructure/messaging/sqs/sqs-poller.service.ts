import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import {
  DeleteMessageBatchCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { getAwsCredentials } from '../../helpers/aws.helper';
import { PaymentEventsConsumer } from './payment-events.consumer';

/**
 * Solo en contenedor (local/ECS): consume la cola con long polling.
 * En Lambda la cola se conecta como trigger y entra por handler.ts.
 */
@Injectable()
export class SqsPollerService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(SqsPollerService.name);
  private readonly queueUrl = process.env.ORDER_EVENTS_QUEUE_URL ?? '';
  private running = false;
  private client: SQSClient | null = null;

  constructor(private readonly consumer: PaymentEventsConsumer) {}

  onApplicationBootstrap() {
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) return;

    if (!this.queueUrl) {
      this.logger.warn(
        'ORDER_EVENTS_QUEUE_URL no configurado: no se consumirán eventos PaymentApproved',
      );
      return;
    }

    this.client = new SQSClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
      credentials: getAwsCredentials(),
    });
    this.running = true;
    void this.loop();
  }

  onApplicationShutdown() {
    this.running = false;
  }

  private async loop() {
    while (this.running && this.client) {
      try {
        const { Messages = [] } = await this.client.send(
          new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20,
            VisibilityTimeout: 60,
          }),
        );

        if (!Messages.length) continue;

        const { failedMessageIds } = await this.consumer.handle(
          Messages.map((m) => ({ messageId: m.MessageId!, body: m.Body ?? '' })),
        );

        // Solo se borran los procesados; los fallidos reaparecen tras el timeout
        const processed = Messages.filter(
          (m) => !failedMessageIds.includes(m.MessageId!),
        );

        if (processed.length) {
          await this.client.send(
            new DeleteMessageBatchCommand({
              QueueUrl: this.queueUrl,
              Entries: processed.map((m) => ({
                Id: m.MessageId!,
                ReceiptHandle: m.ReceiptHandle!,
              })),
            }),
          );
        }
      } catch (error) {
        this.logger.error(`Error leyendo la cola: ${(error as Error).message}`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }
}
