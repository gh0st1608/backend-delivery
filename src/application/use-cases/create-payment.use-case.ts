import { PaymentRepository, PaymentRepositorySymbol } from '../../domain/repository/payment.repository';
import { Payment } from '../../domain/payment.entity';
import { CreatePaymentDto } from '../dto/request/create-payment.dto';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject(PaymentRepositorySymbol)
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(dto: CreatePaymentDto) {
    const { orderId, amount, currency, provider, providerOrderId } = dto.Payment;

    const payment = Payment.create({
      orderId,
      amount,
      currency,
      provider,
      providerOrderId
    });

    const paymentId = await this.paymentRepository.save(payment);

    return {
      paymentId,
    };
  }
}
