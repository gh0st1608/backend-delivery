import { IsString, ValidateNested, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class UpdateCourierLocationPayloadDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  courierId: string;

  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => LocationDto)
  location : LocationDto
}


export class UpdateCourierLocationDto {
  @ValidateNested({ each: true })
  @Type(() => UpdateCourierLocationPayloadDto)
  Courier: UpdateCourierLocationPayloadDto;
}
