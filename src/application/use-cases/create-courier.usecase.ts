// src/application/create-order.application.ts
import { Inject, Injectable } from '@nestjs/common';
import {
  CreateOrUpdateCourierResult
} from '../dto/response/response-custom.dto';
import {
  CourierRepository,
  CourierRepositorySymbol,
} from '../../domain/repository/courier.repository';
import { CreateCourierDto } from '../dto/request/create-courier.dto';
import { Courier } from '../../domain/courier.entity';

@Injectable()
export class CreateCourierUseCase {
  constructor(
    @Inject(CourierRepositorySymbol)
    private readonly courierRepository: CourierRepository,
  ) {}

  async execute(dto: CreateCourierDto): Promise<CreateOrUpdateCourierResult> {
    try {
      const { name, phone, vehicleType } = dto.Courier;
      const courier = Courier.create(name, phone, vehicleType);

      const courierId = await this.courierRepository.save(courier);

      return {
        courierId,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
