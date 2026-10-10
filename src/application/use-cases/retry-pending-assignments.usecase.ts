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

const BATCH_SIZE = 25;

/**
 * Reintenta asignar repartidor a órdenes pagadas que aún no lo tienen.
 * Se ejecuta cada Settings.assignment.retryIntervalSeconds (en contenedor
 * con un temporizador; en Lambda con una regla programada de EventBridge).
 */
@Injectable()
export class RetryPendingAssignmentsUseCase {
  private readonly logger = new Logger(RetryPendingAssignmentsUseCase.name);

  constructor(
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,
    @Inject(SettingsRepositorySymbol)
    private readonly settingsRepository: SettingsRepository,
    private readonly autoAssignCourierUseCase: AutoAssignCourierUseCase,
  ) {}

  async execute(): Promise<{ processed: number; assigned: number }> {
    const { assignment } = await this.settingsRepository.getDeliverySettings();

    if (assignment.mode === 'MANUAL') {
      return { processed: 0, assigned: 0 };
    }

    const now = Date.now();
    const pending = (await this.orderRepository.findPendingAssignment(BATCH_SIZE))
      .filter((order) => order.needsCourierAssignment(assignment.maxAttempts))
      .filter((order) => {
        const last = order.toPrimitives().lastAssignmentAttemptAt;
        return (
          !last ||
          now - new Date(last).getTime() >= assignment.retryIntervalSeconds * 1000
        );
      });

    let assigned = 0;

    for (const order of pending) {
      const orderId = order.toPrimitives().orderId;

      try {
        const { outcome } = await this.autoAssignCourierUseCase.execute(orderId);
        if (outcome === 'ASSIGNED') assigned += 1;
      } catch (error) {
        this.logger.error(
          `Reintento de asignación falló para ${orderId}: ${(error as Error).message}`,
        );
      }
    }

    return { processed: pending.length, assigned };
  }
}
