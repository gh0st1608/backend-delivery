import { Inject, Injectable } from '@nestjs/common';
import {
  OrderRepository,
  OrderRepositorySymbol,
} from '../../domain/repository/order.repository';
import { OrderNotFoundException } from '../exceptions/order-not-found.exception';
import { OrderValidationException } from '../exceptions/order-validation.exception';
import { CreateOrUpdateOrderResult } from '../dto/response/response-custom.dto';
import { DomainErrorMessages } from '../../domain/constants/messages';

/**
 * El cliente confirma que recibió su pedido. Es la única transición de
 * estado que puede hacer un cliente; el resto la hacen repartidor/operador.
 */
@Injectable()
export class ConfirmDeliveryUseCase {
  constructor(
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(
    orderId: string,
    requesterId: string,
  ): Promise<CreateOrUpdateOrderResult> {
    const order = await this.orderRepository.getById(orderId);

    if (!order || !order.isOwnedBy(requesterId)) {
      throw new OrderNotFoundException();
    }

    if (order.getDeliveryStatus() === 'DELIVERED') {
      return { orderId };
    }

    if (!order.canBeConfirmedByCustomer()) {
      throw new OrderValidationException(
        DomainErrorMessages.ORDER_NOT_CONFIRMABLE,
      );
    }

    order.markAsDelivered();
    await this.orderRepository.save(order);

    return { orderId };
  }
}
