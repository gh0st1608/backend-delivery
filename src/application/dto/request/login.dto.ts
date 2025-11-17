import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsIn,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LoginPayloadDto {
  @IsString()
  @IsIn(['password'], { message: 'authType debe ser uno de: password' })
  authType: string;

  @ValidateIf(o => o.authType === 'password')
  @IsEmail({}, { message: 'El email no es válido' })
  email: string;

  @ValidateIf(o => o.authType === 'password')
  @IsString()
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  password: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}

export class LoginDto {
  @ValidateNested()
  @Type(() => LoginPayloadDto)
  Auth: LoginPayloadDto;
}

