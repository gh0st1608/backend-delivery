import {
  IsString,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PreferencePayloadDto {
  @IsString()
  @IsNotEmpty({ message: 'userId no puede ser vacío'})
  userId: string;

  @IsOptional()
  @IsArray()
  categoryIds?: string[];
}

export class CreatePreferenceDto {
  @ValidateNested()
  @Type(() => PreferencePayloadDto)
  Preference: PreferencePayloadDto;
}
