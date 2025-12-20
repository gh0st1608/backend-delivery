import { GetByParamsDto } from '../../application/dto/request/get-by-params.dto';
import { PaginatedResult } from '../../application/dto/response/response-custom.dto';
import { Category } from '../category.entity';

export interface CategoryRepository {
  getById(id: string): Promise<Category>;
  getList(query: GetByParamsDto): Promise<PaginatedResult<Category>>;
  save(product: Category): Promise<string>;
}

export const CategoryRepositorySymbol = Symbol('CategoryRepository');
