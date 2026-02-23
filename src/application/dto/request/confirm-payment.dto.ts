import { IsString, IsNotEmpty, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentProvider } from '../../../domain/types/shared';

export class ConfirmPaymentPayloadDto {
  // PayPal
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  PayerID: string;

  @IsNotEmpty()
  @IsEnum(PaymentProvider, {
    message: `provider debe ser uno de: ${Object.values(PaymentProvider).join(', ')}`,
  })
  provider: PaymentProvider;
}

export class ConfirmPaymentDto {
  @ValidateNested()
  @Type(() => ConfirmPaymentPayloadDto)
  Payment: ConfirmPaymentPayloadDto;
}
