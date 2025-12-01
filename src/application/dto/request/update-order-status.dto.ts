// src/application/dto/request/update-order-status.dto.ts
import { IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { OrderStatus } from '../../../domain/order.entity';
import { Type } from 'class-transformer';

export class UpdateStatusPayloadDto {
  @IsNotEmpty()
  @IsEnum(['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'SHIPPED', 'DELIVERED'], {
    message: 'Invalid order status',
  })
  status: OrderStatus;
}

export class UpdateStatusDto {

  @ValidateNested({ each: true })
  @Type(() => UpdateStatusPayloadDto)
  Order: UpdateStatusPayloadDto;
}