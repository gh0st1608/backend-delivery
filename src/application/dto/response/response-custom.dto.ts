import { Product } from '../../../domain/product.entity';

export interface CreateProductResponseDto {
  product: {
    id: string;
  };
  statusCode: number;
  message: string;
}

export interface GetProductResponseDto {
  product: Product;
  statusCode: number;
  message: string;
}

export class GetProductsResponseDto {
  items: Product[];
  nextCursor: string;
  statusCode: number;
  message: string;
}
