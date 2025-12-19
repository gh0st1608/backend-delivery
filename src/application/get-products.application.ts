import { Inject, Injectable } from '@nestjs/common';
import { ProductRepository } from '../domain/repository/product.repository';
import { ProductRepositorySymbol } from '../domain/repository/product.repository';
import { GetProductsDto } from './dto/request/get-products-by-params.dto';
import { GetProductsResponseDto } from './dto/response/response-custom.dto';
import { DomainSuccessMessages } from '../domain/constants/messages';
import { HttpStatusResponse } from '../domain/constants/http-code';

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject(ProductRepositorySymbol)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(
    query: GetProductsDto,
  ): Promise<GetProductsResponseDto> {
    const { items, count, nextCursor} = await this.productRepository.getList(query);

    return {
      items,
      count,
      nextCursor,
      statusCode: HttpStatusResponse.OK,
      message: DomainSuccessMessages.GET_PRODUCTS_SUCCESS,
    };
  }
}
