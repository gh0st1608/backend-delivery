import { DomainEvent } from '../interfaces/event.interface';

export interface CartEventPublisher {
  publishCartCreated(event: DomainEvent): Promise<void>;
  publishItemAdded(event: DomainEvent): Promise<void>;
  publishItemRemoved(event: DomainEvent): Promise<void>;
  publishCartCleared(event: DomainEvent): Promise<void>;
}

export const CartEventPublisherSymbol = Symbol('CartEventPublisher');
//export const UserEventPublisherSymbol = Symbol('UserEventPublisher');
