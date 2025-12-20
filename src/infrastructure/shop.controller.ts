import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';

import { CreateProductUseCase } from '../application/create-product.application';
import { GetProductByIdUseCase } from '../application/get-product-by-id.application';
import { GetProductsUseCase } from '../application/get-products.application';
import { GetCategoriesUseCase } from '../application/get-categories.application';

import { CreateProductDto } from '../application/dto/request/create-product.dto';
import { GetByParamsDto } from '../application/dto/request/get-by-params.dto';
import { DomainSuccessMessages } from '../domain/constants/messages';
import { HttpStatusResponse } from '../domain/constants/http-code';
import { CreateCategoryUseCase } from '../application/create-product.application copy';
import { CreateCategoryDto } from '../application/dto/request/create-category.dto';
import { Entities } from '../domain/types/shared';

@Controller('shop')
export class ShopController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductsUseCase: GetProductsUseCase,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
    private readonly getCategoriesUseCase: GetCategoriesUseCase,
    private readonly createCategoryUseCase: CreateCategoryUseCase,
  ) {}

  @Get('products/:id')
  async getById(@Param('id') id: string) {
    const { product } = await this.getProductByIdUseCase.execute(id);

    return this.ok(
      Entities.PRODUCT,
      product,
      DomainSuccessMessages.GET_PRODUCT_SUCCESS,
    );
  }

  @Post('products')
  async createProduct(@Body() body: CreateProductDto) {
    const product = await this.createProductUseCase.execute(body);

    return this.ok(
      Entities.PRODUCT,
      product,
      DomainSuccessMessages.CREATE_PRODUCT_SUCCESS,
    );
  }

  @Get('products')
  async getProducts(@Query() query: GetByParamsDto) {
    const result = await this.getProductsUseCase.execute(query);

    return this.okPaginated(
      result.items,
      result.count,
      result.nextCursor,
      DomainSuccessMessages.GET_PRODUCTS_SUCCESS,
    );
  }

  @Post('categories')
  async createCategory(@Body() body: CreateCategoryDto) {
    const category = await this.createCategoryUseCase.execute(body);

    return this.ok(
      Entities.CATEGORY,
      category,
      DomainSuccessMessages.CREATE_CATEGORY_SUCCESS,
    );
  }

  @Get('categories')
  async getCategories(@Query() query: GetByParamsDto) {
    const result = await this.getCategoriesUseCase.execute(query);

    return this.okPaginated(
      result.items,
      result.count,
      result.nextCursor,
      DomainSuccessMessages.GET_CATEGORIES_SUCCESS,
    );
  }

  // =======================
  // PRIVATE HELPERS
  // =======================

  private ok<T>(key: string, data: T, message: string) {
    return {
      [key]: data,
      statusCode: HttpStatusResponse.OK,
      message,
    };
  }

  private okPaginated<T>(
    items: T[],
    count: number,
    nextCursor?: string,
    message?: string,
  ) {
    return {
      items,
      count,
      nextCursor,
      statusCode: HttpStatusResponse.OK,
      message,
    };
  }
}
