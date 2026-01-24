import { IsString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOrderLocationPayloadDto {
  @IsString()
  orderId: string;

  @IsString()
  courierId: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}


export class UpdateOrderLocationDto {
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderLocationPayloadDto)
  Order: UpdateOrderLocationPayloadDto;
}
