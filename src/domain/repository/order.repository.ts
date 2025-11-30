import { Order } from '../../domain/order.entity';

export interface OrderRepository {
  save(order: Order): Promise<string>;
  getById(id: string): Promise<Order | null>;
}

export const OrderRepositorySymbol = Symbol('OrderRepository');
