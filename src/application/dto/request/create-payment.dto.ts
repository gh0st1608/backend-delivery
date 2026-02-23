import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsIn,
  ValidateNested,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentProvider } from '../../../domain/types/shared';

export class PaymentPayloadDto {
  @IsString()
  @IsNotEmpty({ message: 'orderId no puede ser vacío' })
  orderId: string;

  @IsNumber({}, { message: 'amount debe ser un número' })
  amount: number;

  @IsString()
  @IsNotEmpty({ message: 'currency no puede ser vacío' })
  currency: string;

  @IsNotEmpty()
  @IsEnum(PaymentProvider, {
    message: `provider debe ser uno de: ${Object.values(PaymentProvider).join(', ')}`,
  })
  provider: PaymentProvider;

  @IsOptional()
  @IsString()
  providerOrderId: string;
}

export class CreatePaymentDto {
  @ValidateNested()
  @Type(() => PaymentPayloadDto)
  Payment: PaymentPayloadDto;
}
