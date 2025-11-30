import { Cart } from '../../../domain/entities/cart.entity';


export interface CartGetResponseDto {
  cart: Cart;
  statusCode: number;
  message: string;
}

export interface SuccessResponseDto {
  cart: {
    id: string;
  };
  statusCode: number;
  message: string;
}

