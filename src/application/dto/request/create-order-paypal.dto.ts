import {
  IsNotEmpty,
  ValidateNested,
  IsUrl,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentPayloadDto } from './create-payment.dto';

export class PaymentPaypalDto extends PaymentPayloadDto{
  @IsNotEmpty()
  @IsString()
  successUrl: string;

  @IsNotEmpty()
  @IsString()
  cancelUrl: string;
}

export class CreatePaymentPaypalDto {
  @ValidateNested()
  @Type(() => PaymentPaypalDto)
  Payment: PaymentPaypalDto;
}
