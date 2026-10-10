import { Injectable, Logger } from '@nestjs/common';
import { HandlePaymentApprovedUseCase } from '../../../application/use-cases/handle-payment-approved.usecase';

export interface QueueMessage {
  messageId: string;
  body: string;
}

/**
 * Procesa mensajes de la cola de eventos de order (EventBridge → SQS).
 * Formato: sobre de EventBridge con el DomainEvent en "detail".
 * Devuelve los ids fallidos para que SQS los reintente (y, tras N intentos,
 * los envíe a la DLQ configurada en la cola).
 */
@Injectable()
export class PaymentEventsConsumer {
  private readonly logger = new Logger(PaymentEventsConsumer.name);

  constructor(
    private readonly handlePaymentApprovedUseCase: HandlePaymentApprovedUseCase,
  ) {}

  async handle(messages: QueueMessage[]): Promise<{ failedMessageIds: string[] }> {
    const failedMessageIds: string[] = [];

    for (const message of messages) {
      try {
        await this.process(message);
      } catch (error) {
        this.logger.error(
          `Error procesando mensaje ${message.messageId}: ${(error as Error).message}`,
        );
        failedMessageIds.push(message.messageId);
      }
    }

    return { failedMessageIds };
  }

  private async process(message: QueueMessage) {
    let envelope: any;

    try {
      envelope = JSON.parse(message.body);
    } catch {
      // Mensaje corrupto: reintentarlo no lo arregla
      this.logger.error(`Mensaje no es JSON: ${message.messageId}`);
      return;
    }

    const type = envelope?.['detail-type'] ?? envelope?.detail?.type;
    const payload = envelope?.detail?.payload;

    if (type !== 'PaymentApproved') {
      this.logger.debug?.(`Evento ignorado: ${type}`);
      return;
    }

    if (!payload?.orderId || !payload?.paymentId) {
      this.logger.error(`PaymentApproved sin orderId/paymentId: ${message.messageId}`);
      return;
    }

    await this.handlePaymentApprovedUseCase.execute({
      orderId: payload.orderId,
      paymentId: payload.paymentId,
      userId: payload.userId,
      amountUsd: Number(payload.amountUsd),
    });
  }
}
