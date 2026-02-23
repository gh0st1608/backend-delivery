import { Inject, Injectable } from '@nestjs/common';
import { OrderRepository, OrderRepositorySymbol } from '../../domain/repository/order.repository';
import { GetOrderResult } from '../dto/response/response-custom.dto';
import { OrderNotFoundException } from '../exceptions/order-not-found.exception';
import { Order } from '../../domain/order.entity';

@Injectable()
export class GetOrderByIdUseCase {
  constructor(
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(id: string): Promise<GetOrderResult<Order>> {
    const order = await this.orderRepository.getById(id);

    if (!order) {
      throw new OrderNotFoundException();
    }

    return {
      order,
    };
  }
}
