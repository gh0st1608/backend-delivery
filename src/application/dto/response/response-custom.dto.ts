import { Cursor } from '../../../domain/constants/types';
import { Courier } from '../../../domain/courier.entity';
import { Order } from '../../../domain/order.entity';


export interface PaginatedResult<T> {
  items: T[];
  count: number;
  nextCursor?: Cursor;
}

export type GetOrdersResult = PaginatedResult<Order>;

export type GetCouriersResult = PaginatedResult<Courier>;

export interface GetCourierResult<T> {
  courier: T;
}

export interface GetOrderResult<T> {
  order: T;
}

export interface CreateOrUpdateOrderResult {
  orderId: string;
}

export interface CreateOrUpdateCourierResult {
  courierId: string;
}

export interface GetOrderStatusResult {
  statusDelivery: string;
}

