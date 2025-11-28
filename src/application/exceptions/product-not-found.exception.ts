import { DomainErrorMessages } from '../../domain/constants/messages';
import { ApplicationException } from './application.exception';

export class ProductNotFoundException extends ApplicationException {
  constructor() {
    super(1000, DomainErrorMessages.PRODUCT_NOT_FOUND);
  }
}
