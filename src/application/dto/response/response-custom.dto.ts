import { Cursor, Product } from '../../../domain/product.entity';

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

export interface PaginatedResult<T> {
  items: T[];
  count: number;
  nextCursor?: Cursor;
}

export class GetProductsResponseDto {
  items: Product[];
  count: number;
  nextCursor?: Cursor;
  statusCode: number;
  message: string;
}