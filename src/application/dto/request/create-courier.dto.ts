// src/application/dto/request/create-order.dto.ts
import { IsString, ValidateNested, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CourierStatus, CourierVehicleType } from '../../../domain/constants/enums';

export class CreateCourierPayloadDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEnum(CourierVehicleType)
  @IsNotEmpty()
  vehicleType: CourierVehicleType;

  @IsEnum(CourierStatus)
  @IsOptional()
  status: CourierStatus;
}

export class CreateCourierDto {

  @ValidateNested({ each: true })
  @Type(() => CreateCourierPayloadDto)
  Courier: CreateCourierPayloadDto;
}