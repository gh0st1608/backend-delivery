import { Order } from '../../../domain/order.entity';


export interface OrderGetResponseDto {
  order: Order;
  statusCode: number;
  message: string;
}

export interface SuccessResponseDto {
  order: {
    orderId: string;
  };
  statusCode: number;
  message: string;
}

