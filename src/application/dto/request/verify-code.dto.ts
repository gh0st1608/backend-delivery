import { IsEmail, IsString, Length, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Payload con los datos del usuario a registrar.
 */
export class VerifyCodePayloadDto {
  @IsEmail({}, { message: 'El email no es válido.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsString({ message: 'El codigo ingresado debe ser una cadena' })
  @Length(4, 4, { message: 'El codigo ingresado debe ser de 4 digitos' })
  code: string;
}

/**
 * Contenedor intermedio que replica la estructura { Data: { User: { ... } } }.
 */
export class VerifyCodeDto {
  @ValidateNested()
  @Type(() => VerifyCodePayloadDto)
  User: VerifyCodePayloadDto;
}
