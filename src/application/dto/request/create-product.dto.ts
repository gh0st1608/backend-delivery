import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IngredientDto } from './create-ingredient.dto';

export class ProductPayloadDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto no puede estar vacio' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripcion del producto no puede estar vacio' })
  description: string;

  @IsString()
  @IsNotEmpty({ message: 'La categoria del producto no puede estar vacio' })
  categoryId: string;

  @IsString()
  @IsNotEmpty({ message: 'La locacion del producto no puede estar vacio' })
  storeId: string;

  // Precio base en pesos chilenos (CLP no usa decimales)
  @IsInt({ message: 'El precio debe ser un entero en CLP' })
  @Min(1, { message: 'El precio debe ser mayor a 0' })
  price: number;

  @IsOptional()
  @IsString()
  currency: string;

  @IsOptional()
  @IsNumber()
  stock: number;

  @IsOptional()
  @IsArray({ message: 'Ingredients debe ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  ingredients?: IngredientDto[];
}

export class CreateProductDto {
  @ValidateNested()
  @Type(() => ProductPayloadDto)
  Product: ProductPayloadDto;
}
