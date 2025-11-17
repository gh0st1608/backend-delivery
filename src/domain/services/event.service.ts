import { DomainEvent } from "../interfaces/event.interface";

export interface EventUserPublisher {
  publish(event: DomainEvent): Promise<void>;
}

export const EventUserPublisherSymbol = Symbol(
  'EventUserPublisher',
);
