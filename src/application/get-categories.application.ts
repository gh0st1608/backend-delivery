import { Inject, Injectable } from '@nestjs/common';
import { CategoryRepository } from '../domain/repository/category.repository';
import { CategoryRepositorySymbol } from '../domain/repository/category.repository';
import { GetByParamsDto } from './dto/request/get-by-params.dto';
import { GetCategoriesResult } from './dto/response/response-custom.dto';

@Injectable()
export class GetCategoriesUseCase {
  constructor(
    @Inject(CategoryRepositorySymbol)
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(query: GetByParamsDto): Promise<GetCategoriesResult> {
    const { items, count, nextCursor } =
      await this.categoryRepository.getList(query);

    return {
      items,
      count,
      nextCursor,
    };
  }
}
