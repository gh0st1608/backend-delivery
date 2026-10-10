import { randomUUID } from 'crypto';
import { DomainEvent } from '../interfaces/event.interface';

// Lo consume backend-order (EventBridge → SQS) para marcar la orden como
// pagada y disparar la asignación del repartidor.
export class PaymentApprovedEvent implements DomainEvent {
  readonly id: string;
  readonly type = 'PaymentApproved';
  readonly source = 'payment-service';
  readonly occurredAt = new Date();

  constructor(
    public readonly payload: {
      paymentId: string;
      orderId: string;
      userId: string;
      provider: string;
      amountUsd: number;
      amountClp: number;
    },
  ) {
    this.id = randomUUID();
  }
}
