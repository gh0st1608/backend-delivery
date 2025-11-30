import { v4 as uuidv4 } from 'uuid';
import { DomainEvent } from '../domain/interfaces/event.interface';

export function buildDomainEvent(eventName: string, payload: any): DomainEvent {
  return {
    eventId: uuidv4(),
    eventName,
    occurredOn: new Date().toISOString(),
    payload,
  };
}