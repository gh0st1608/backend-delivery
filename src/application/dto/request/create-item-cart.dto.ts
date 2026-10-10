import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

export class ItemCartPayloadDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  image?: string;
}

export class ItemCartDto {
  @ValidateNested()
  @Type(() => ItemCartPayloadDto)
  Cart!: ItemCartPayloadDto;
}
