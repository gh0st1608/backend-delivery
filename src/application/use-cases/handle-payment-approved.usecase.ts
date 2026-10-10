import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  OrderRepository,
  OrderRepositorySymbol,
} from '../../domain/repository/order.repository';
import {
  SettingsRepository,
  SettingsRepositorySymbol,
} from '../../domain/repository/settings.repository';
import { AutoAssignCourierUseCase } from './auto-assign-courier.usecase';

export interface PaymentApprovedPayload {
  paymentId: string;
  orderId: string;
  userId?: string;
  amountUsd: number;
}

// Tolerancia de redondeo entre lo cobrado y el total congelado en la orden
const AMOUNT_TOLERANCE_USD = 0.01;

/**
 * Reacciona al evento PaymentApproved (EventBridge → SQS):
 * 1. Marca la orden como PAID (idempotente: el evento puede llegar repetido).
 * 2. Si la asignación es AUTO, busca repartidor. Si no hay, la orden queda
 *    pendiente y RetryPendingAssignmentsUseCase la reintenta.
 */
@Injectable()
export class HandlePaymentApprovedUseCase {
  private readonly logger = new Logger(HandlePaymentApprovedUseCase.name);

  constructor(
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,
    @Inject(SettingsRepositorySymbol)
    private readonly settingsRepository: SettingsRepository,
    private readonly autoAssignCourierUseCase: AutoAssignCourierUseCase,
  ) {}

  async execute(payload: PaymentApprovedPayload): Promise<void> {
    const order = await this.orderRepository.getById(payload.orderId);

    if (!order) {
      // No se reintenta: un orderId inexistente no se arregla solo
      this.logger.error(`PaymentApproved para orden inexistente ${payload.orderId}`);
      return;
    }

    if (payload.userId && !order.isOwnedBy(payload.userId)) {
      this.logger.error(
        `PaymentApproved con usuario distinto al de la orden ${payload.orderId}`,
      );
      return;
    }

    if (!order.isPaid()) {
      const difference = Math.abs(order.getTotalUsd() - Number(payload.amountUsd));

      if (difference > AMOUNT_TOLERANCE_USD) {
        // Requiere revisión manual: no se libera el pedido
        this.logger.error(
          `Monto pagado (${payload.amountUsd} USD) no coincide con la orden ${payload.orderId} (${order.getTotalUsd()} USD)`,
        );
        return;
      }

      order.markAsPaid(payload.paymentId);
      await this.orderRepository.save(order);
    }

    const { assignment } = await this.settingsRepository.getDeliverySettings();

    if (assignment.mode === 'MANUAL') {
      this.logger.log(`Orden ${payload.orderId} pagada; asignación manual`);
      return;
    }

    try {
      await this.autoAssignCourierUseCase.execute(payload.orderId);
    } catch (error) {
      // El pago ya quedó registrado; el reintento periódico volverá a intentarlo
      this.logger.error(
        `Fallo al asignar repartidor a ${payload.orderId}: ${(error as Error).message}`,
      );
    }
  }
}
