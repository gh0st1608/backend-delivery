import { Injectable, Inject } from '@nestjs/common';
import {
  PaymentRepository,
  PaymentRepositorySymbol,
} from '../../domain/repository/payment.repository';
import { PaymentNotFoundException } from '../exceptions/payment-not-found.exception';
import { ConfirmPaymentDto } from '../dto/request/confirm-payment.dto';
import {
  PaypalPaymentGateway,
  PaypalPaymentGatewaySymbol,
} from '../../domain/services/paypal.gateway';
import {
  PaymentEventPublisher,
  PaymentEventPublisherSymbol,
} from '../../domain/services/event.publisher';
import { Payment } from '../../domain/payment.entity';
import { PaymentNotCompleteException } from '../exceptions/payment-not-complete.exception';

@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    @Inject(PaymentRepositorySymbol)
    private readonly paymentRepository: PaymentRepository,

    @Inject(PaypalPaymentGatewaySymbol)
    private readonly paymentGateway: PaypalPaymentGateway,

    @Inject(PaymentEventPublisherSymbol)
    private readonly eventPublisher: PaymentEventPublisher,
  ) {}

  async execute(confirmDto: ConfirmPaymentDto) {
    const { token, provider } = confirmDto.Payment;
    // 1️⃣ Obtener pago existente
    const payment = await this.paymentRepository.findByProviderOrderId(
      provider,
      token,
    );

    if (!payment) {
      throw new PaymentNotFoundException();
    }

    // 2️⃣ Capturar pago en PayPal
    const {
      providerReferenceOrderId,
      providerPaymentStatus,
      providerPaymentId,
      payerEmail,
    } = await this.paymentGateway.captureOrder(token);

    if (providerPaymentStatus !== 'COMPLETED') {
      payment.fail();
      await this.paymentRepository.save(payment);
      throw new PaymentNotCompleteException();
    }

    // 3️⃣ Confirmar pago en dominio
    payment.confirm({
      providerPaymentId,
      payerEmail,
    });

    // 4️⃣ Persistir
    await this.paymentRepository.save(payment);

    // 5️⃣ Emitir evento (opcional pero correcto)
    /*
    await this.eventPublisher.publish(
      new PaymentConfirmedEvent(
        payment.properties().paymentId,
        payment.properties().orderId,
        provider,
      ),
    );
    */

    return {
      orderId: providerReferenceOrderId,
      paymentId: payment.properties().paymentId,
      providerPaymentId,
      providerPaymentStatus,
    };
  }
}
