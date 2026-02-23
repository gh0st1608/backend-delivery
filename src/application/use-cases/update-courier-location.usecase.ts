import { Inject, Injectable } from '@nestjs/common';
import { UpdateCourierLocationDto } from '../dto/request/update-courier-location.dto';
import {
  SocketServerGatewaySymbol,
  SocketServerGateway,
} from '../../domain/services/socket.server';
import {
  CourierRepository,
  CourierRepositorySymbol,
} from '../../domain/repository/courier.repository';
import { CourierLocationSocketEvent } from '../../domain/interfaces/event-socket.interface';
import {
  EtaService,
  EtaServiceSymbol,
} from '../../domain/services/eta.service';
import {
  OrderRepository,
  OrderRepositorySymbol,
} from '../../domain/repository/order.repository';

@Injectable()
export class UpdateCourierLocationUseCase {
  constructor(
    @Inject(SocketServerGatewaySymbol)
    private readonly socketServerGateway: SocketServerGateway,

    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,

    @Inject(CourierRepositorySymbol)
    private readonly courierRepository: CourierRepository,

    @Inject(EtaServiceSymbol)
    private readonly etaService: EtaService,
  ) {}

  async execute(dto: UpdateCourierLocationDto): Promise<void> {
    const { courierId, orderId, location } = dto.Courier;

    const order = await this.orderRepository.getById(orderId);
    const courier = await this.courierRepository.getById(courierId);

    // 1️⃣ Actualizar ubicación del courier
    courier.updateLocation(location.lat, location.lng);

    // 2️⃣ Obtener fase directamente desde el dominio
    const phase = order.getCurrentPhase();

    // 3️⃣ Determinar destino según fase (usando dominio)
    let destination: { lat: number; lng: number };

    if (phase === 'TO_PICKUP') {
      destination = order.getPickupLocation();
    }

    if (phase === 'TO_DROPOFF') {
      destination = order.getDropoffLocation();
    }

    // 4️⃣ Calcular ETA si corresponde
    const eta = this.etaService.calculate({
      from: {
        lat: courier.properties().currentLat!,
        lng: courier.properties().currentLng!,
      },
      to: destination,
    });

    // 5️⃣ Construir evento
    const payloadEvent: CourierLocationSocketEvent = {
      orderId,
      phase,
      courier: {
        id: courier.properties().courierId,
        name: courier.properties().name,
      },
      location,
      pickup: order.getPickupLocation(),
      dropoff: order.getDropoffLocation(),
      eta,
    };

    // 6️⃣ Persistir y emitir
    await this.courierRepository.save(courier);
    await this.socketServerGateway.emitCourierLocation(payloadEvent);
  }
}
