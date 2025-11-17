import {
  IsString,
  IsEmail,
  IsNotEmpty,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Payload con los datos del usuario a registrar.
 */
export class RegisterUserPayloadDto {
  @IsEmail({}, { message: 'El email no es válido.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(128, { message: 'La contraseña no debe exceder 128 caracteres.' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es requerido.' })
  @MaxLength(150, { message: 'El nombre completo no debe exceder 150 caracteres.' })
  fullname: string;
}

/**
 * Contenedor intermedio que replica la estructura { Data: { User: { ... } } }.
 */
export class RegisterDto {
  @ValidateNested()
  @Type(() => RegisterUserPayloadDto)
  User: RegisterUserPayloadDto;
}
