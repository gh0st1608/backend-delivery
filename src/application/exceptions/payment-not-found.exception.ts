import { ApplicationException } from './application.exception';
import { DomainErrorMessages } from '../../domain/constants/messages';

// También cuando el pago es de otro usuario (no se confirma su existencia)
export class PaymentNotFoundException extends ApplicationException {
  constructor() {
    super(3000, DomainErrorMessages.PAYMENT_NOT_FOUND, 'No encontrado', 404);
  }
}
