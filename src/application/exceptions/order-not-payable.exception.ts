import { ApplicationException } from './application.exception';
import { DomainErrorMessages } from '../../domain/constants/messages';

export class OrderNotPayableException extends ApplicationException {
  constructor() {
    super(3002, DomainErrorMessages.ORDER_NOT_PAYABLE, 'Orden no pagable', 409);
  }
}
