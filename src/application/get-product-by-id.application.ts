// src/application/use-cases/login.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import { ProductRepository } from '../domain/repository/product.repository';
import { HttpStatusResponse } from '../domain/constants/http-code';
import { DomainSuccessMessages } from '../domain/constants/messages';
import { ProductRepositorySymbol } from '../domain/repository/product.repository';
import { ProductNotFoundException } from './exceptions/product-not-found.exception';
import { GetProductResponseDto } from './dto/response/response-custom.dto';

@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject(ProductRepositorySymbol)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: string): Promise<GetProductResponseDto> {
    try {
      const product = await this.productRepository.getById(id);

      if (!product) {
        throw new ProductNotFoundException();
      }

      return {
        product,
        statusCode: HttpStatusResponse.OK,
        message: DomainSuccessMessages.GET_PRODUCT_SUCCESS,
      };
    } catch (error) {
      console.log(error);
    }
  }
}
