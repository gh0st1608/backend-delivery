import { Inject, Injectable } from '@nestjs/common';
import { OrderRepository, OrderRepositorySymbol } from '../../domain/repository/order.repository';
import { OrderGetResponseDto } from '../dto/response/response-custom.dto';
import { OrderNotFoundException } from '../exceptions/order-not-found.exception';
import { HttpStatusResponse } from '../../domain/constants/http-code';
import { DomainSuccessMessages } from '../../domain/constants/messages';

@Injectable()
export class GetOrderByIdUseCase {
  constructor(
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(id: string): Promise<OrderGetResponseDto> {
    const order = await this.orderRepository.getById(id);

    if (!order) {
      throw new OrderNotFoundException();
    }

    return {
      order,
      statusCode: HttpStatusResponse.OK,
      message: DomainSuccessMessages.GET_ORDER_SUCESS
    };
  }
}
