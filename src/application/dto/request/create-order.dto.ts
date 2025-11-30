// src/application/dto/request/create-order.dto.ts
import { IsArray, IsNotEmpty, IsString, ValidateNested, IsNumber, ArrayMinSize } from 'class-validator';
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