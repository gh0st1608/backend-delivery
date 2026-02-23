import { Inject, Injectable } from '@nestjs/common';
import {
  GetCourierResult,
} from '../dto/response/response-custom.dto';
import { OrderNotFoundException } from '../exceptions/order-not-found.exception';
import {
  CourierRepository,
  CourierRepositorySymbol,
} from '../../domain/repository/courier.repository';
import { Courier } from '../../domain/courier.entity';
import { CourierNotFoundException } from '../exceptions/courier-not-found.exception';

@Injectable()
export class GetCourierByIdUseCase {
  constructor(
    @Inject(CourierRepositorySymbol)
    private readonly courierRepository: CourierRepository,
  ) {}

  async execute(id: string): Promise<GetCourierResult<Courier>> {
    const courier = await this.courierRepository.getById(id);

    if (!courier) {
      throw new CourierNotFoundException();
    }

    return {
      courier,
    };
  }
}
