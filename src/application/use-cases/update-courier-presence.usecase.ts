import { Inject, Injectable } from '@nestjs/common';
import {
  CourierRepository,
  CourierRepositorySymbol,
} from '../../domain/repository/courier.repository';
import { UpdateCourierPresenceDto } from '../dto/request/update-courier-presence.dto';
import { CourierNotFoundException } from '../exceptions/courier-not-found.exception';

@Injectable()
export class UpdateCourierPresenceUseCase {
  constructor(
    @Inject(CourierRepositorySymbol)
    private readonly courierRepository: CourierRepository,
  ) {}

  async execute(courierId: string, dto: UpdateCourierPresenceDto) {
    const courier = await this.courierRepository.getById(courierId);

    if (!courier) {
      throw new CourierNotFoundException();
    }

    const {
      location,
      status,
    } = dto.Courier;

    courier.updateLocation(location.lat, location.lng);

    if (status === 'AVAILABLE') {
      courier.activate();
    }

    if (status === 'OFFLINE') {
      courier.deactivate();
    }

    if (status === 'BUSY') {
      courier.assignOrder();
    }

    await this.courierRepository.save(courier);

    return {
      courierId,
      status: courier.properties().status,
      location: {
        lat: courier.properties().currentLat,
        lng: courier.properties().currentLng,
      },
      lastLocationAt: courier.properties().lastLocationAt,
    };
  }
}
