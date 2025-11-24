import { DomainErrorMessages } from '../../domain/constants/messages';
import { ApplicationException } from './application.exception';

export class VerificationCodeExpiredException extends ApplicationException {
  constructor() {
    super(1005, DomainErrorMessages.EXPIRED_VERIFICATION_CODE);
  }
}
