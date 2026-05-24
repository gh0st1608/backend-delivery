import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CourierStatus } from '../../../domain/constants/enums';

class PresenceLocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class UpdateCourierPresencePayloadDto {
  @ValidateNested()
  @Type(() => PresenceLocationDto)
  location: PresenceLocationDto;

  @IsEnum(CourierStatus)
  @IsOptional()
  status?: CourierStatus;
}

export class UpdateCourierPresenceDto {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => UpdateCourierPresencePayloadDto)
  Courier: UpdateCourierPresencePayloadDto;
}
