import { DomainErrorMessages } from '../../domain/constants/messages';
import { ApplicationException } from './application.exception';

export class StatusNotSupportedException extends ApplicationException {
  constructor() {
    super(1000, DomainErrorMessages.STATUS_NOT_SUPPORTED);
  }
}
