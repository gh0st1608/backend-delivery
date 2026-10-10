import { Inject, Injectable } from '@nestjs/common';
import {
  OrderRepository,
  OrderRepositorySymbol,
} from '../../domain/repository/order.repository';
import { OrderNotFoundException } from '../exceptions/order-not-found.exception';
import { GetOrderStatusResult } from '../dto/response/response-custom.dto';

@Injectable()
export class GetOrderStatusUseCase {
  constructor(
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(
    orderId: string,
    requesterId: string,
  ): Promise<GetOrderStatusResult> {
    const order = await this.orderRepository.getById(orderId);

    if (!order || !order.isOwnedBy(requesterId)) {
      throw new OrderNotFoundException();
    }

    return {
      statusDelivery: order.getDeliveryStatus(),
    };
  }
}
