import { Inject, Injectable } from '@nestjs/common';
import { ProductRepository } from '../domain/repository/product.repository';
import { ProductRepositorySymbol } from '../domain/repository/product.repository';
import { ProductNotFoundException } from './exceptions/product-not-found.exception';
import { GetResult } from './dto/response/response-custom.dto';
import { Product } from '../domain/product.entity';

@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject(ProductRepositorySymbol)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: string): Promise<GetResult<Product>> {
    try {
      const product = await this.productRepository.getById(id);

      if (!product) {
        throw new ProductNotFoundException();
      }

      return {
        product,
      };
    } catch (error) {
      throw error;
    }
  }
}
