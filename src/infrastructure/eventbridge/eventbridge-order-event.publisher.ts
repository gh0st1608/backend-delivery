import { Injectable } from '@nestjs/common';
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';

import { DomainEvent } from '../../domain/interfaces/event.interface';
import { OrderEventPublisher } from '../../domain/services/event.publisher';

@Injectable()
export class EventBridgeOrderEventPublisherImpl
  implements OrderEventPublisher
{
  private readonly client: EventBridgeClient;

  constructor() {
    this.client = new EventBridgeClient({
      region: process.env.AWS_REGION,
    });
  }

  async publish(event: DomainEvent): Promise<void> {
    const command = new PutEventsCommand({
      Entries: [
        {
          Source: event.source,          // 🔥 parametrizable
          DetailType: event.type,         // 🔥 evento real
          Detail: JSON.stringify(event),
          EventBusName: process.env.EVENT_BUS_NAME,
        },
      ],
    });

    await this.client.send(command);
  }
}
