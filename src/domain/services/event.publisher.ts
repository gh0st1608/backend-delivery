import { DomainEvent } from '../interfaces/event.interface';

export interface OrderEventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

export const OrderEventPublisherSymbol = Symbol('OrderEventPublisher');