// src/application/dto/request/create-order.dto.ts
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Solo producto y cantidad: precio y nombre se toman del catálogo (shop)
class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(50)
  quantity: number;
}

// El usuario se toma del access token; nunca del body
export class CreateOrderPayloadDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsLatitude()
  deliveryLat: number;

  @IsLongitude()
  deliveryLng: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => CreateOrderPayloadDto)
  Order: CreateOrderPayloadDto;
}
