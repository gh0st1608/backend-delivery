import { Inject, Injectable } from '@nestjs/common';
import { ProductRepository } from '../domain/repository/product.repository';
import { ProductRepositorySymbol } from '../domain/repository/product.repository';
import { GetByParamsDto } from './dto/request/get-by-params.dto';
import { GetProductsResult } from './dto/response/response-custom.dto';

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject(ProductRepositorySymbol)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(query: GetByParamsDto): Promise<GetProductsResult> {
    const { items, count, nextCursor } =
      await this.productRepository.getList(query);

    return {
      items,
      count,
      nextCursor,
    };
  }
}
