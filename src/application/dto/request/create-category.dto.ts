import {
  IsString,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CategoryPayloadDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la categoria no puede estar vacio' })
  name: string;

  @IsString()
  @IsNotEmpty({
    message: 'La descripcion de la categoria no puede estar vacio',
  })
  description: string;

  @IsOptional()
  @IsString()
  image: string;
}

export class CreateCategoryDto {
  @ValidateNested()
  @Type(() => CategoryPayloadDto)
  Category: CategoryPayloadDto;
}
