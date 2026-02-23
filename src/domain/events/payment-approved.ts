import { DomainEvent } from '../interfaces/event.interface';

export class PaymentApprovedEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'PaymentApproved';
  readonly source = 'payment-service';
  readonly occurredAt = new Date();

  constructor(
    public readonly payload: {
      paymentId: string;
      orderId: string;
      provider: 'PAYPAL' | 'STRIPE';
      amount: number;
    },
  ) {
    this.id = crypto.randomUUID();
  }
}
