import { DomainEvent } from '../interfaces/event.interface';

export interface UserEventPublisher {
  publishEmailVerification(payload: DomainEvent): Promise<void>;
  publishUserRegistered(payload: DomainEvent): Promise<void>;
}

export const UserEventPublisherSymbol = Symbol('UserEventPublisher');
