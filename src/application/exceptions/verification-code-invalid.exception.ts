import { DomainErrorMessages } from '../../domain/constants/messages';
import { ApplicationException } from './application.exception';

export class VerificationCodeInvalidException extends ApplicationException {
  constructor() {
    super(1005, DomainErrorMessages.INVALID_VERIFICATION_CODE);
  }
}
