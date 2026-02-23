import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  OrderRepository,
  OrderRepositorySymbol,
} from '../../domain/repository/order.repository';
import { OrderStatus } from '../../domain/order.entity';
import { OrderNotFoundException } from '../exceptions/order-not-found.exception';
import { StatusNotSupportedException } from '../exceptions/status-not-supported.exception';
import { CreateOrUpdateOrderResult, GetOrderStatusResult } from '../dto/response/response-custom.dto';

@Injectable()
export class GetOrderStatusUseCase {
  constructor(
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(
    orderId: string
  ): Promise<GetOrderStatusResult> {
    try{
    const order = await this.orderRepository.getById(orderId);
    if (!order) throw new OrderNotFoundException();

    const orderEntity =  await this.orderRepository.getById(orderId);

    const statusDelivery = orderEntity.toPrimitives().statusDelivery

    return {
      statusDelivery,
    };
    } catch(error){
      console.log(error)
    }
  }
}
