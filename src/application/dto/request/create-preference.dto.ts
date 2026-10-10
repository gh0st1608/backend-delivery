import {
  IsString,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// El usuario se obtiene del access token, no del body (evita IDOR)
export class PreferencePayloadDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  categoryIds: string[];
}

export class CreatePreferenceDto {
  @ValidateNested()
  @Type(() => PreferencePayloadDto)
  Preference: PreferencePayloadDto;
}
