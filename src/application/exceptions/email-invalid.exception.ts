import { DomainErrorMessages } from '../../domain/constants/messages';
import { ApplicationException } from './application.exception';

export class EmailInvalidException extends ApplicationException {
  constructor() {
    super(1000, DomainErrorMessages.INVALID_EMAIL);
  }
}
