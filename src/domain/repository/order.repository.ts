import { GetByParamsDto } from '../../application/dto/request/get-by-params.dto';
import { PaginatedResult } from '../../application/dto/response/response-custom.dto';
import { Order } from '../../domain/order.entity';

export interface OrderRepository {
  save(order: Order): Promise<string>;
  getById(id: string): Promise<Order | null>;
  getList(query: GetByParamsDto): Promise<PaginatedResult<Order>>;
}

export const OrderRepositorySymbol = Symbol('OrderRepository');
