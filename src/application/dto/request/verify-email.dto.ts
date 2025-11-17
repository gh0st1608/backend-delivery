import {
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Payload con los datos del usuario a registrar.
 */
export class VerifyEmailPayloadDto {
  @IsEmail({}, { message: 'El email no es válido.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;
}

/**
 * Contenedor intermedio que replica la estructura { Data: { User: { ... } } }.
 */
export class VerifyEmailDto {
  @ValidateNested()
  @Type(() => VerifyEmailPayloadDto)
  User: VerifyEmailPayloadDto;
}
