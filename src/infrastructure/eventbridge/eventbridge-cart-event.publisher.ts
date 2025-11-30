import { Injectable } from '@nestjs/common';
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import { CartEventPublisher } from '../../domain/services/cart-event.publisher';
import { DomainEvent } from '../../domain/interfaces/event.interface';

@Injectable()
export class EventBridgeCartEventPublisher implements CartEventPublisher {
  private readonly client = new EventBridgeClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  private async publish(
    detailType: string,
    payload: DomainEvent,
  ): Promise<void> {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: 'cart-service',
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

  async publishCartCreated(event: DomainEvent): Promise<void> {
    return this.publish('CartCreated', event);
  }

  async publishItemAdded(event: DomainEvent): Promise<void> {
    return this.publish('CartItemAdded', event);
  }

  async publishItemRemoved(event: DomainEvent): Promise<void> {
    return this.publish('CartItemRemoved', event);
  }

  async publishCartCleared(event: DomainEvent): Promise<void> {
    return this.publish('CartCleared', event);
  }
}
