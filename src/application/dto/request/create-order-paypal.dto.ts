import {
  IsNotEmpty,
  ValidateNested,
  IsString,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentProvider } from '../../../domain/types/shared';

// Monto y moneda NO vienen del cliente: se toman de la orden
export class PaymentPaypalDto {
  @IsString()
  @IsNotEmpty({ message: 'orderId no puede ser vacío' })
  orderId: string;

  @IsNotEmpty()
  @IsEnum(PaymentProvider, {
    message: `provider debe ser uno de: ${Object.values(PaymentProvider).join(', ')}`,
  })
  provider: PaymentProvider;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  successUrl: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  cancelUrl: string;
}

export class CreatePaymentPaypalDto {
  @ValidateNested()
  @Type(() => PaymentPaypalDto)
  Payment: PaymentPaypalDto;
}
