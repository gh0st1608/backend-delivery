import { Inject, Injectable } from '@nestjs/common';
import { CreateResult } from './dto/response/response-custom.dto';
import {
  CategoryRepository,
  CategoryRepositorySymbol,
} from '../domain/repository/category.repository';
import { CreateCategoryDto } from './dto/request/create-category.dto';
import { Category } from '../domain/category.entity';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CategoryRepositorySymbol)
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(createCategoryDto: CreateCategoryDto): Promise<CreateResult> {
    try {
      const { name, description, image } = createCategoryDto.Category;
      const category = Category.create({
        name,
        description,
        image,
      });

      const categoryId = await this.categoryRepository.save(category);

      return {
        id: categoryId,
      };
    } catch (error) {
      console.log(error);
    }
  }
}
