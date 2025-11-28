import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductPayloadDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto no puede estar vacio' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripcion del producto no puede estar vacio' })
  description: string;

  @IsNumber()
  @IsNotEmpty({ message: 'El precio del producto no puede estar vacio' })
  price: number;

  @IsOptional()
  @IsString()
  currency: string;

  @IsOptional()
  @IsNumber()
  stock: number;
}

export class CreateProductDto {
  @ValidateNested()
  @Type(() => ProductPayloadDto)
  Product: ProductPayloadDto;
}
