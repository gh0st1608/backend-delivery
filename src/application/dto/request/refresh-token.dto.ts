import { IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RefreshTokenPayloadDto {
  // Opcional: en web el refresh token viaja en una cookie HttpOnly
  @IsOptional()
  @IsString()
  @MaxLength(200)
  refreshToken?: string;
}

export class RefreshTokenDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => RefreshTokenPayloadDto)
  Auth?: RefreshTokenPayloadDto;
}
