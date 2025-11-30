import { DomainErrorMessages } from '../../domain/constants/messages';
import { ApplicationException } from './application.exception';

export class CartNotFoundException extends ApplicationException {
  constructor() {
    super(1000, DomainErrorMessages.CART_NOT_FOUND);
  }
}
