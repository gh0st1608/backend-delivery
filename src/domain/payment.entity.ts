import { v4 as uuidv4 } from 'uuid';
import { PaymentProvider, PaymentStatus } from './types/shared';

export interface PaymentRequired {
  readonly orderId: string;
  readonly amount: number;
  readonly currency: string;
  readonly provider: PaymentProvider;
  readonly providerOrderId: string;
}

export interface PaymentOptional {
  readonly paymentId: string;
  readonly status: PaymentStatus;
  readonly providerPaymentId: string;
  readonly payerEmail: string;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date;
}

export type PaymentProperties = PaymentRequired & Partial<PaymentOptional>;

export type PaymentPropertiesUpdate = Partial<
  Omit<PaymentRequired, ''> &
    Pick<PaymentOptional, 'status' | 'active' | 'updatedAt'>
>;

export class Payment {
  private paymentId: string;
  private orderId: string;
  private providerOrderId: string;
  private amount: number;
  private currency: string;
  private status: PaymentStatus;
  private active: boolean;
  private provider: PaymentProvider;
  private providerPaymentId: string;
  private payerEmail: string;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date;

  constructor(properties: PaymentProperties) {
    this.active = true;
    Object.assign(this, properties);
  }

  properties(): PaymentProperties {
    return {
      paymentId: this.paymentId,
      orderId: this.orderId,
      amount: this.amount,
      currency: this.currency,
      providerOrderId: this.providerOrderId,
      status: this.status,
      provider: this.provider,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }

  static create(data: {
    orderId: string;
    amount: number;
    currency: string;
    provider: PaymentProvider;
    providerOrderId: string;
  }): Payment {
    const now = new Date();
    return new Payment({
      paymentId: uuidv4(),
      orderId: data.orderId,
      providerOrderId: data.providerOrderId,
      amount: data.amount,
      currency: data.currency,
      provider: data.provider,
      status: PaymentStatus.PENDING,
      createdAt: now,
    });
  }

  update(properties: PaymentPropertiesUpdate): Payment {
    return Object.assign(this, {
      ...properties,
      updatedAt: new Date(),
    });
  }

  confirm(data: { providerPaymentId: string; payerEmail?: string }): void {
    this.assertNotFinal();
    this.status = PaymentStatus.APPROVED;
    this.providerPaymentId = data.providerPaymentId;
    this.payerEmail = data.payerEmail;
    this.updatedAt = new Date();
  }

  fail(): void {
    this.assertNotFinal();
    this.status = PaymentStatus.FAILED;
    this.updatedAt = new Date();
  }

  cancel(): void {
    this.assertNotFinal();
    this.status = PaymentStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  private assertNotFinal(): void {
    if (
      this.status === PaymentStatus.APPROVED ||
      this.status === PaymentStatus.CANCELLED
    ) {
      throw new Error(`Payment ${this.paymentId} is already in final state`);
    }
  }

  toPrimitives() {
    return {
      PK: `PAYMENT#${this.paymentId}`,
      SK: 'METADATA',
      GSI1PK: `ORDER#${this.orderId}`,
      GSI1SK: `PAYMENT#${this.paymentId}`,
      GSI2PK: `TOKEN#${this.providerOrderId}`,
      GSI2SK: `PROVIDER#${this.provider}`,
      paymentId: this.paymentId,
      orderId: this.orderId,
      providerOrderId: this.providerOrderId,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      provider: this.provider,
      providerPaymentId: this.providerPaymentId,
      payerEmail: this.payerEmail,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString() ?? null,
      deletedAt: this.deletedAt?.toISOString() ?? null,
    };
  }

  static fromPrimitives(item: Record<string, any>): Payment {
    return new Payment({
      paymentId: item.paymentId,
      orderId: item.orderId,
      providerOrderId: item.providerOrderId,
      amount: item.amount,
      currency: item.currency,
      status: item.status,
      provider: item.provider,
      active: item.active,
      providerPaymentId: item.providerPaymentId,
      payerEmail: item.payerEmail,
      createdAt: new Date(item.createdAt),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
      deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
    });
  }
}
