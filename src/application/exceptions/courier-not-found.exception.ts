import { DomainErrorMessages } from '../../domain/constants/messages';
import { ApplicationException } from './application.exception';

export class CourierNotFoundException extends ApplicationException {
  constructor() {
    super(1000, DomainErrorMessages.COURIER_NOT_FOUND);
  }
}
