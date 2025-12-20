import { Category } from '../../../domain/category.entity';
import { Product } from '../../../domain/product.entity';
import { Cursor } from '../../../domain/types/shared';

export interface PaginatedResult<T> {
  items: T[];
  count: number;
  nextCursor?: Cursor;
}

export type GetProductsResult = PaginatedResult<Product>;

export type GetCategoriesResult = PaginatedResult<Category>;

export interface CreateResult {
  id: string;
}

export interface GetResult<T> {
  product: T;
}

/* export interface CreateProductResponseDto {
  product: {
    id: string;
  };
  statusCode: number;
  message: string;
} */

/* export interface GetProductResponseDto {
  product: Product;
  statusCode: number;
  message: string;
} */

/* export class GetProductsResponseDto {
  items: Product[];
  count: number;
  nextCursor?: Cursor;
  statusCode: number;
  message: string;
}

export class GetCategoriesResponseDto {
  items: Category[];
  count: number;
  nextCursor?: Cursor;
  statusCode: number;
  message: string;
} */
