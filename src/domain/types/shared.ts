export type Cursor = string & { readonly __brand: unique symbol };
export enum Entities {
  PAYMENT = 'payment'
}
export enum PaymentProvider {
  PAYPAL = 'Paypal',
  STRIPE = 'Stripe'
}
export enum PaymentStatus {
  PENDING = 'PENDIENTE',
  APPROVED = 'APROBADO',
  REJECTED = 'RECHAZADO',
  FAILED = 'FALLIDO',
  CANCELLED = 'CANCELADO'
}
