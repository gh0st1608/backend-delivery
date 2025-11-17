import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { ConfigService } from '@nestjs/config';
import { EventUserPublisher } from '../../domain/services/event.service';
import { DomainEvent } from '../../domain/interfaces/event.interface';

export class EventUserPublisherImpl implements EventUserPublisher {
  private sns: SNSClient;
  private topicArn: string;

  constructor() {
    this.sns = new SNSClient({ region: process.env.REGION });
    this.topicArn = process.env.EVENT_USER_REGISTERED_TOPIC;

  }

  async publish(event: DomainEvent): Promise<void> {
    const message = {
      event: event.name,
      data: event.payload,
    };

    const command = new PublishCommand({
      TopicArn: this.topicArn,
      Message: JSON.stringify(message),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: event.name,
        },
      },
    });

    await this.sns.send(command);
  }
}
