import { DomainEvent } from '../interfaces/event.interface';

export interface PaymentEventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

export const PaymentEventPublisherSymbol = Symbol('PaymentEventPublisher');