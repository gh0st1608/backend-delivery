import {
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  OrderRepository,
  OrderRepositorySymbol,
} from '../../domain/repository/order.repository';
import { OrderDeliveryStatus } from '../../domain/order.entity';
import { OrderNotFoundException } from '../exceptions/order-not-found.exception';
import { StatusNotSupportedException } from '../exceptions/status-not-supported.exception';
import { CreateOrUpdateOrderResult } from '../dto/response/response-custom.dto';

@Injectable()
export class UpdateOrderStatusDeliveryUseCase {
  constructor(
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(
    orderId: string,
    newStatus: OrderDeliveryStatus,
  ): Promise<CreateOrUpdateOrderResult> {
    try{
    const order = await this.orderRepository.getById(orderId);
    if (!order) throw new OrderNotFoundException();

    switch (newStatus) {
      case 'ASSIGNED':
        order.markAsAssigned();
        break;

      case 'PREPARING':
        order.markAsPreparing();
        break;

      case 'PICKED_UP':
        order.markAsPickedUp();
        break;

      case 'ON_THE_WAY':
        order.markAsOnTheWay();
        break;
      
      case 'DELIVERED':
        order.markAsDelivered();
        break;

      default:
        throw new StatusNotSupportedException();
    }

    await this.orderRepository.save(order);

    return {
      orderId,
    };
    } catch(error){
      console.log(error)
    }
  }
}
