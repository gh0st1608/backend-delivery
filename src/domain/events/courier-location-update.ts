import { DomainEvent } from '../interfaces/event.interface';

export class LocationUpdatedEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'LocationUpdated';
  readonly source = 'order-service';
  readonly occurredAt = new Date();

  constructor(
    public readonly payload: {
      locationId: string;
      orderId: string;
    },
  ) {
    this.id = crypto.randomUUID();
  }
}
