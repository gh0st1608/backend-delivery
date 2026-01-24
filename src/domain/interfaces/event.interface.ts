export interface DomainEvent {
  id: string;
  type: string;         // PaymentApproved, PaymentFailed, etc
  source: string;       // payment-service
  occurredAt: Date;
  payload: unknown;
}
