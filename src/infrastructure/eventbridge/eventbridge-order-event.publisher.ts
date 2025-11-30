import { Injectable } from '@nestjs/common';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { OrderEventPublisher } from '../../domain/services/order-event.publisher';
import { DomainEvent } from '../../domain/interfaces/event.interface';

@Injectable()
export class EventBridgeOrderEventPublisher implements OrderEventPublisher {
  private readonly client = new EventBridgeClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  private async publish(detailType: string, payload: DomainEvent): Promise<void> {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: 'order-service',
          DetailType: detailType,
          Detail: JSON.stringify(payload),
          EventBusName: process.env.EVENT_BUS_NAME,
        },
      ],
    });

    const resp = await this.client.send(command);
    if ((resp as any).FailedEntryCount && (resp as any).FailedEntryCount > 0) {
      console.error('EventBridge publish failed', resp);
      throw new Error('Event publish failed');
    }
  }

  async publishOrderCreated(event: DomainEvent): Promise<void> {
    return this.publish('OrderCreated', event);
  }
}
