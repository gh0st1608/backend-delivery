// src/application/create-order.application.ts
import { Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from '../dto/request/create-order.dto';
import { Order } from '../../domain/order.entity';
import {
  OrderRepository,
  OrderRepositorySymbol,
} from '../../domain/repository/order.repository';
import { CreateOrUpdateOrderResult } from '../dto/response/response-custom.dto';
import {
  StoreLocationService,
  StoreLocationServiceSymbol,
} from '../../domain/services/store.repository';
import { AutoAssignCourierUseCase } from './auto-assign-courier.usecase';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,
    @Inject(StoreLocationServiceSymbol)
    private readonly storeLocationService: StoreLocationService,
    private readonly autoAssignCourierUseCase: AutoAssignCourierUseCase,
  ) {}

  async execute(dto: CreateOrderDto): Promise<CreateOrUpdateOrderResult> {
    try {
      const { userId, storeId, items, deliveryLat, deliveryLng } = dto.Order;
      const { pickupLat, pickupLng } = await this.storeLocationService.getLocation(storeId);

      const order = Order.create(userId, pickupLat, pickupLng, deliveryLat, deliveryLng, items);

      const orderId = await this.orderRepository.save(order);
      await this.autoAssignCourierUseCase.execute(orderId);

      return { orderId };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
