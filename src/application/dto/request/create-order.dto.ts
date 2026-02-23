// src/application/dto/request/create-order.dto.ts
import { IsArray, IsNotEmpty, IsString, ValidateNested, IsNumber, ArrayMinSize, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;
}

export class CreateOrderPayloadDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsNumber()
  @IsOptional()
  deliveryLat: number;

  @IsNumber()
  @IsOptional()
  deliveryLng: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class CreateOrderDto {

  @ValidateNested({ each: true })
  @Type(() => CreateOrderPayloadDto)
  Order: CreateOrderPayloadDto;
}