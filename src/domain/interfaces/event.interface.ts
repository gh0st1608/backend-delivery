export interface DomainEvent<T = any> {
  readonly eventId: string;
  readonly eventName: string;
  readonly occurredOn: string; // ISO string for transport
  readonly payload: T;
}