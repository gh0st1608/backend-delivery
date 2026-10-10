import { DomainErrorMessages } from '../../domain/constants/messages';
import { ApplicationException } from './application.exception';

export class CartItemNotFoundException extends ApplicationException {
  constructor() {
    super(1001, DomainErrorMessages.CART_ITEM_NOT_FOUND);
  }
}
