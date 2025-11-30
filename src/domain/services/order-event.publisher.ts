import { DomainEvent } from '../interfaces/event.interface';

export interface OrderEventPublisher {
  publishOrderCreated(event: DomainEvent): Promise<void>;
}

export const OrderEventPublisherSymbol = Symbol('OrderEventPublisher');
