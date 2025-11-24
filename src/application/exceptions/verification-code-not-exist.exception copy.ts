import { DomainErrorMessages } from '../../domain/constants/messages';
import { ApplicationException } from './application.exception';

export class VerificationCodeNotExistException extends ApplicationException {
  constructor() {
    super(1005, DomainErrorMessages.NOT_EXIST_VERIFICATION_CODE);
  }
}
