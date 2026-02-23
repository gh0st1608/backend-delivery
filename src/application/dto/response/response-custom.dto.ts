import { Tokens } from '../../../domain/interfaces/tokens.interface';
import { Cursor } from '../../../domain/types/shared';
import { Payment } from '../../../domain/payment.entity';

export interface PaginatedResult<T> {
  items: T[];
  count: number;
  nextCursor?: Cursor;
}

export type GetPaymentsResult = PaginatedResult<Payment>;

export interface CreatePaymentResult {
  ids: string[];
}

export interface GetPaymentResult<T> {
  payment: T;
}