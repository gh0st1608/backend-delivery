// src/application/dto/request/update-order-status.dto.ts
import { IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { OrderDeliveryStatus } from '../../../domain/order.entity';
import { Type } from 'class-transformer';

export class UpdateStatusPayloadDto {
  @IsNotEmpty()
  @IsEnum(['ASSIGNED', 'PREPARING', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED','CANCELED'], {
    message: 'Invalid order status delivery',
  })
  statusDelivery: OrderDeliveryStatus;
}

export class UpdateStatusDto {

  @ValidateNested({ each: true })
  @Type(() => UpdateStatusPayloadDto)
  Order: UpdateStatusPayloadDto;
}