import { DomainErrorMessages } from '../../domain/constants/messages';
import { ApplicationException } from './application.exception';

export class OrderNotFoundException extends ApplicationException {
  constructor() {
    super(1000, DomainErrorMessages.ORDER_NOT_FOUND);
  }
}
