import { Inject, Injectable } from '@nestjs/common';
import {
  ProductRepository,
  ProductRepositorySymbol,
} from '../domain/repository/product.repository';
import { CreateResult } from '../application/dto/response/response-custom.dto';
import { CreateProductDto } from '../application/dto/request/create-product.dto';
import { Product } from '../domain/product.entity';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(ProductRepositorySymbol)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(createProductDto: CreateProductDto): Promise<CreateResult> {
    try {
      const { name, description, price, stock, ingredients } =
        createProductDto.Product;
      const product = Product.create({
        name,
        description,
        price,
        stock,
        ingredients,
      });

      const productId = await this.productRepository.save(product);

      return {
        id: productId,
      };
    } catch (error) {
      console.log(error);
    }
  }
}
