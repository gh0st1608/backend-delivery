// src/application/use-cases/login.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import { ProductRepository } from '../domain/repository/product.repository';
import { ProductRepositorySymbol } from '../domain/repository/product.repository';
import { GetProductsResponseDto } from './dto/response/response-custom.dto';
import { GetProductsDto } from './dto/request/get-products-by-params.dto';
import { DomainSuccessMessages } from '../domain/constants/messages';
import { HttpStatusResponse } from '../domain/constants/http-code';

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject(ProductRepositorySymbol)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(query: GetProductsDto): Promise<GetProductsResponseDto> {
    try {
      const { items, nextCursor } = await this.productRepository.getList(query);
      return {
        items,
        nextCursor,
        statusCode: HttpStatusResponse.OK,
        message: DomainSuccessMessages.GET_PRODUCTS_SUCCESS,
      };
    } catch (error) {
      console.log(error);
    }
  }
}
