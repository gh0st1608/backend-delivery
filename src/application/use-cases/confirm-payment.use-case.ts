import { Injectable, Inject, Logger } from '@nestjs/common';
import { PaymentApprovedEvent } from '../../domain/events/payment-approved';
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
  private readonly logger = new Logger(ConfirmPaymentUseCase.name);

  constructor(
    @Inject(PaymentRepositorySymbol)
    private readonly paymentRepository: PaymentRepository,

    @Inject(PaypalPaymentGatewaySymbol)
    private readonly paymentGateway: PaypalPaymentGateway,

    @Inject(PaymentEventPublisherSymbol)
    private readonly eventPublisher: PaymentEventPublisher,
  ) {}

  async execute(userId: string, confirmDto: ConfirmPaymentDto) {
    const { token, provider } = confirmDto.Payment;
    // 1️⃣ Obtener pago existente
    const payment = await this.paymentRepository.findByProviderOrderId(
      provider,
      token,
    );

    // Solo quien inició el pago puede confirmarlo
    if (!payment || !payment.belongsTo(userId)) {
      throw new PaymentNotFoundException();
    }

    // Idempotencia: si ya fue capturado (reintento, recarga de la pantalla
    // de éxito), PayPal rechazaría una segunda captura.
    if (payment.isApproved()) {
      const { orderId, paymentId, providerPaymentId } = payment.properties();
      // Se reemite el evento: si la primera publicación falló, así se recupera.
      // order lo procesa de forma idempotente.
      await this.publishApproved(payment);
      return {
        orderId,
        paymentId,
        providerPaymentId,
        providerPaymentStatus: 'COMPLETED',
      };
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

    // 5️⃣ Avisar a order para marcar la orden pagada y asignar repartidor
    await this.publishApproved(payment);

    return {
      orderId: providerReferenceOrderId,
      paymentId: payment.properties().paymentId,
      providerPaymentId,
      providerPaymentStatus,
    };
  }

  // El pago ya está capturado: un fallo al publicar no debe responder error al
  // cliente. Se reintenta y, si persiste, queda registrado para reconciliar.
  private async publishApproved(payment: Payment) {
    const props = payment.properties();
    const event = new PaymentApprovedEvent({
      paymentId: props.paymentId,
      orderId: props.orderId,
      userId: props.userId,
      provider: props.provider,
      amountUsd: props.amount,
      amountClp: props.amountClp,
    });

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.eventPublisher.publish(event);
        return;
      } catch (error) {
        this.logger.error(
          `Intento ${attempt} de publicar PaymentApproved (${props.paymentId}) falló: ${(error as Error).message}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 200 * attempt));
      }
    }

    this.logger.error(
      `PaymentApproved NO publicado para el pago ${props.paymentId} (orden ${props.orderId}). Requiere reconciliación.`,
    );
  }
}
