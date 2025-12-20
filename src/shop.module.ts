// src/infrastructure/modules/auth.module.ts

import { Module } from '@nestjs/common';
import { ProductRepositoryImpl } from './infrastructure/repository/product.repository.impl';
import { ShopController } from './infrastructure/shop.controller';
import { ProductRepositorySymbol } from './domain/repository/product.repository';
import { ConfigModule } from '@nestjs/config';
import { CreateProductUseCase } from './application/create-product.application';
import { GetProductByIdUseCase } from './application/get-product-by-id.application';
import { GetProductsUseCase } from './application/get-products.application';
import { GetCategoriesUseCase } from './application/get-categories.application';
import { CategoryRepositoryImpl } from './infrastructure/repository/category.repository.impl';
import { CategoryRepositorySymbol } from './domain/repository/category.repository';
import { CreateCategoryUseCase } from './application/create-product.application copy';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${process.env.NODE_ENV || ''}.env`,
      isGlobal: true,
    }),
  ],
  controllers: [ShopController],
  providers: [
    CreateProductUseCase,
    GetProductByIdUseCase,
    GetProductsUseCase,
    GetCategoriesUseCase,
    CreateCategoryUseCase,
    {
      provide: ProductRepositorySymbol,
      useClass: ProductRepositoryImpl,
    },
    {
      provide: CategoryRepositorySymbol,
      useClass: CategoryRepositoryImpl,
    },
  ],
})
export class ShopModule {}
