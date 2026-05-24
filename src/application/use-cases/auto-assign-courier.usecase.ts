import { Inject, Injectable } from '@nestjs/common';
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
import { AssignCourierToOrderUseCase } from './assign-courier-to-order.usecase';

@Injectable()
export class AutoAssignCourierUseCase {
  private readonly maxLocationAgeSeconds = Number(
    process.env.COURIER_MAX_LOCATION_AGE_SECONDS ?? 120,
  );

  private readonly maxCandidates = Number(
    process.env.COURIER_AUTO_ASSIGN_MAX_CANDIDATES ?? 25,
  );

  constructor(
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,

    @Inject(CourierRepositorySymbol)
    private readonly courierRepository: CourierRepository,

    @Inject(EtaServiceSymbol)
    private readonly etaService: EtaService,

    private readonly assignCourierToOrderUseCase: AssignCourierToOrderUseCase,
  ) {}

  async execute(orderId: string): Promise<{ courierId: string | null }> {
    const order = await this.orderRepository.getById(orderId);

    if (!order || order.toPrimitives().courierId) {
      return { courierId: order?.toPrimitives().courierId ?? null };
    }

    const candidates = await this.courierRepository.findAvailable(
      this.maxCandidates,
      this.maxLocationAgeSeconds,
    );

    if (!candidates.length) {
      return { courierId: null };
    }

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
      .sort((left, right) => {
        if (left.etaMinutes !== right.etaMinutes) {
          return left.etaMinutes - right.etaMinutes;
        }

        return left.distanceKm - right.distanceKm;
      });

    const bestCandidate = rankedCandidates[0];

    await this.assignCourierToOrderUseCase.execute(
      orderId,
      bestCandidate.courierId,
    );

    return { courierId: bestCandidate.courierId };
  }
}
