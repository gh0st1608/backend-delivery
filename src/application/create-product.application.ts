import { Inject, Injectable } from '@nestjs/common';
import {
  ProductRepository,
  ProductRepositorySymbol,
} from '../domain/repository/product.repository';
import { CreateProductResponseDto } from '../application/dto/response/response-custom.dto';
import { HttpStatusResponse } from '../domain/constants/http-code';
import { DomainSuccessMessages } from '../domain/constants/messages';
import { CreateProductDto } from '../application/dto/request/create-product.dto';
import { Product } from '../domain/product.entity';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(ProductRepositorySymbol)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(
    createProductDto: CreateProductDto,
  ): Promise<CreateProductResponseDto> {
    try {
      const { name, description, price, stock, ingredients } = createProductDto.Product;
      const product = Product.create({
        name,
        description,
        price,
        stock,
        ingredients
      });
      // 2. Persistir en el repositorio (hexagonal)
      const productId = await this.productRepository.save(product);

      // 3. Retornar DTO con mensaje y estado
      return {
        product: {
          id: productId,
        },
        statusCode: HttpStatusResponse.OK,
        message: DomainSuccessMessages.CREATE_PRODUCT_SUCCESS,
      };
    } catch (error) {
      console.log(error);
    }
  }
}
