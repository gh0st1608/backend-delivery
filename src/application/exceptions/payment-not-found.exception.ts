import { ApplicationException } from './application.exception';
import { DomainErrorMessages } from '../../domain/constants/messages';

export class PaymentNotFoundException extends ApplicationException {
  constructor() {
    super(3000,DomainErrorMessages.PAYMENT_NOT_FOUND);
  }
}
