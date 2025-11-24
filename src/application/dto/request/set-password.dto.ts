import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  MinLength,
  MaxLength,
  IsEmail,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Payload con los datos del usuario a registrar.
 */
export class SetPasswordPayloadDto {
  @IsEmail({}, { message: 'El email no es válido.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(128, { message: 'La contraseña no debe exceder 128 caracteres.' })
  password: string;
}

/**
 * Contenedor intermedio que replica la estructura { Data: { User: { ... } } }.
 */
export class SetPasswordDto {
  @ValidateNested()
  @Type(() => SetPasswordPayloadDto)
  User: SetPasswordPayloadDto;
}
