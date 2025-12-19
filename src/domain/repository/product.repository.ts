import { GetProductsDto } from '../../application/dto/request/get-products-by-params.dto';
import { PaginatedResult } from '../../application/dto/response/response-custom.dto';
import { Product } from '../product.entity';

export interface ProductRepository {
  getById(id: string): Promise<Product>;
  getList(query: GetProductsDto): Promise<PaginatedResult<Product>>;
  save(product: Product): Promise<string>;
}

export const ProductRepositorySymbol = Symbol('ProductRepository');
