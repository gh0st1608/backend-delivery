import { Inject, Injectable } from '@nestjs/common';
import { GetByParamsDto } from '../dto/request/get-by-params.dto';
import { GetOrdersResult } from '../dto/response/response-custom.dto';
import { OrderRepository, OrderRepositorySymbol } from '../../domain/repository/order.repository';

@Injectable()
export class GetOrdersUseCase {
  constructor(
    @Inject(OrderRepositorySymbol)
    private readonly orderRepository: OrderRepository,
  ) {}

  // Solo las órdenes del usuario autenticado
  async execute(userId: string, query: GetByParamsDto): Promise<GetOrdersResult> {
    const { items, count, nextCursor } =
      await this.orderRepository.getListByUser(userId, query);
    return { items, count, nextCursor };
  }
}
