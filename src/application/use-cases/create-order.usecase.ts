// src/application/create-order.application.ts
import { Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from '../dto/request/create-order.dto';
import { Order } from '../../domain/order.entity';
import {
  OrderRepository,
  OrderRepositorySymbol,
} from '../../domain/repository/order.repository';
import { SuccessResponseDto } from '../dto/response/response-custom.dto';
import {
  OrderEventPublisherSymbol,
  OrderEventPublisher,
} from '../../domain/services/event.publisher';
import { ORDER_EVENTS } from '../events/order.events';
import { DomainSuccessMessages } from '../../domain/constants/messages';
import { HttpStatusResponse } from '../../domain/constants/http-code';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,
    @Inject(OrderEventPublisherSymbol)
    private readonly orderEventPublisher: OrderEventPublisher,
  ) {}

  async execute(dto: CreateOrderDto): Promise<SuccessResponseDto> {
    try {
      const { userId, items } = dto.Order;
      const order = Order.create(userId, items);

      // persist
      const orderId = await this.orderRepository.save(order);

      /* const ev = buildDomainEvent(ORDER_EVENTS.ORDER_CREATED, {
        userId,
      });

      await this.orderEventPublisher.publish(ev); */

      return {
        order: {
          orderId,
        },
        message: DomainSuccessMessages.CREATE_ORDER_SUCCESS,
        statusCode: HttpStatusResponse.OK,
      };
    } catch (error) {
      console.log(error)
      throw error;
    }
  }
}
