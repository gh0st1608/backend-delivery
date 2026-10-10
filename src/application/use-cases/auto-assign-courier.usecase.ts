import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CourierRepository,
  CourierRepositorySymbol,
} from '../../domain/repository/courier.repository';
import {
  OrderRepository,
  OrderRepositorySymbol,
} from '../../domain/repository/order.repository';
import {
  EtaService,
  EtaServiceSymbol,
} from '../../domain/services/eta.service';
import {
  SettingsRepository,
  SettingsRepositorySymbol,
} from '../../domain/repository/settings.repository';
import { AssignCourierToOrderUseCase } from './assign-courier-to-order.usecase';

export type AutoAssignOutcome =
  | 'ASSIGNED'
  | 'ALREADY_ASSIGNED'
  | 'NOT_PAID'
  | 'NO_CANDIDATES'
  | 'ORDER_NOT_FOUND'
  | 'IN_PROGRESS';

/**
 * Asigna el repartidor disponible más cercano (por ETA) a una orden PAGADA.
 * Parámetros (Settings.assignment): antigüedad máxima de la ubicación,
 * candidatos evaluados y distancia máxima a la tienda.
 */
@Injectable()
export class AutoAssignCourierUseCase {
  private readonly logger = new Logger(AutoAssignCourierUseCase.name);
  // Evita asignar dos veces la misma orden si coinciden el evento y el reintento
  private readonly inFlight = new Set<string>();

  constructor(
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,
    @Inject(CourierRepositorySymbol)
    private readonly courierRepository: CourierRepository,
    @Inject(EtaServiceSymbol)
    private readonly etaService: EtaService,
    @Inject(SettingsRepositorySymbol)
    private readonly settingsRepository: SettingsRepository,
    private readonly assignCourierToOrderUseCase: AssignCourierToOrderUseCase,
  ) {}

  async execute(
    orderId: string,
  ): Promise<{ courierId: string | null; outcome: AutoAssignOutcome }> {
    if (this.inFlight.has(orderId)) {
      return { courierId: null, outcome: 'IN_PROGRESS' };
    }

    this.inFlight.add(orderId);

    try {
      return await this.assign(orderId);
    } finally {
      this.inFlight.delete(orderId);
    }
  }

  private async assign(
    orderId: string,
  ): Promise<{ courierId: string | null; outcome: AutoAssignOutcome }> {
    const order = await this.orderRepository.getById(orderId);

    if (!order) {
      return { courierId: null, outcome: 'ORDER_NOT_FOUND' };
    }

    if (order.hasCourier()) {
      return {
        courierId: order.toPrimitives().courierId,
        outcome: 'ALREADY_ASSIGNED',
      };
    }

    // Nunca se asigna un repartidor a una orden sin pagar
    if (!order.isPaid()) {
      return { courierId: null, outcome: 'NOT_PAID' };
    }

    const { assignment } = await this.settingsRepository.getDeliverySettings();

    order.registerAssignmentAttempt();
    await this.orderRepository.save(order);

    const candidates = await this.courierRepository.findAvailable(
      assignment.maxCandidates,
      assignment.maxLocationAgeSeconds,
    );

    const pickup = order.getPickupLocation();

    const rankedCandidates = candidates
      .map((courier) => {
        const properties = courier.properties();
        const eta = this.etaService.calculate({
          from: {
            lat: properties.currentLat!,
            lng: properties.currentLng!,
          },
          to: pickup,
        });

        return {
          courierId: properties.courierId,
          etaMinutes: eta.etaMinutes,
          distanceKm: eta.distanceKm,
        };
      })
      .filter((candidate) => candidate.distanceKm <= assignment.maxPickupDistanceKm)
      .sort((left, right) => {
        if (left.etaMinutes !== right.etaMinutes) {
          return left.etaMinutes - right.etaMinutes;
        }

        return left.distanceKm - right.distanceKm;
      });

    if (!rankedCandidates.length) {
      this.logger.log(
        `Sin repartidores disponibles para ${orderId} (intento ${order.toPrimitives().assignmentAttempts}/${assignment.maxAttempts})`,
      );
      return { courierId: null, outcome: 'NO_CANDIDATES' };
    }

    const bestCandidate = rankedCandidates[0];

    await this.assignCourierToOrderUseCase.execute(
      orderId,
      bestCandidate.courierId,
    );

    return { courierId: bestCandidate.courierId, outcome: 'ASSIGNED' };
  }
}
