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
import { SuccessResponseDto } from '../dto/response/response-custom.dto';
import { DomainSuccessMessages } from '../../domain/constants/messages';
import { HttpStatusResponse } from '../../domain/constants/http-code';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(
    orderId: string,
    newStatus: OrderStatus,
  ): Promise<SuccessResponseDto> {
    try{
    const order = await this.orderRepository.getById(orderId);
    if (!order) throw new OrderNotFoundException();

    switch (newStatus) {
      case 'PAID':
        order.markAsPaid();
        break;

      case 'FAILED':
        order.markAsFailed();
        break;

      case 'CANCELLED':
        order.cancel();
        break;

      case 'SHIPPED':
        order.ship();
        break;

      case 'DELIVERED':
        order.deliver();
        break;

      default:
        throw new StatusNotSupportedException();
    }

    await this.orderRepository.save(order);

    return {
      order: {
        orderId,
      },
      message: DomainSuccessMessages.UPDATE_ORDER_SUCCESS,
      statusCode: HttpStatusResponse.OK,
    };
    } catch(error){
      console.log(error)
    }
  }
}
