import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { CreateProductUseCase } from '../application/create-product.application';
import { GetProductsDto } from '../application/dto/request/get-products-by-params.dto';
import { CreateProductDto } from '../application/dto/request/create-product.dto';
import { GetProductByIdUseCase } from '../application/get-product-by-id.application';
import { GetProductsUseCase } from '../application/get-products.application';

@Controller('shop')
export class ShopController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
  ) {}

  @Get('/products/:id')
  async getById(@Param('id') id: string) {
    return this.getProductByIdUseCase.execute(id);
  }

  @Post('products')
  async create(@Body() body: CreateProductDto) {
    return this.createProductUseCase.execute(body);
  }

  @Get('products')
  async getList(@Query() query: GetProductsDto) {
    return this.getProductsUseCase.execute(query);
  }
}
