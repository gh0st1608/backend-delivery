import { GetByParamsDto } from '../../application/dto/request/get-by-params.dto';
import { PaginatedResult } from '../../application/dto/response/response-custom.dto';
import { Payment } from '../payment.entity';

export interface PaymentRepository {
  save(payment: Payment): Promise<string>;
  findByPaymentId(paymentId: string): Promise<Payment | null>;
  update(payment: Payment): Promise<string>;
  getList(query: GetByParamsDto): Promise<PaginatedResult<Payment>>;
  findByProviderOrderId(provider: string, providerOrderId: string): Promise<Payment | null>;
}

export const PaymentRepositorySymbol = Symbol('PaymentRepository');
