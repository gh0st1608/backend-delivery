import { Injectable } from '@nestjs/common';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { UserEventPublisher } from '../../domain/services/event.publisher';
import { DomainEvent } from '../../domain/interfaces/event.interface';

@Injectable()
export class EventBridgeUserEventPublisher implements UserEventPublisher {
  private readonly client = new EventBridgeClient({
    region: process.env.AWS_REGION,
  });

  private async publish(detailType: string, payload: DomainEvent): Promise<void> {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: 'auth-service',
          DetailType: detailType,
          Detail: JSON.stringify(payload),
          EventBusName: process.env.EVENT_BUS_NAME,
        },
      ],
    });

    await this.client.send(command);
  }

  async publishEmailVerification(event: DomainEvent): Promise<void> {
    return this.publish('EmailVerificationRequested', event);
  }

  async publishUserRegistered(event: DomainEvent): Promise<void> {
    return this.publish('UserRegistered', event);
  }
}
