// src/application/exceptions/login-failed.exception.ts

import { DomainErrorMessages } from '../../domain/constants/messages';
import { ApplicationException } from './application.exception';

export class LoginFailedException extends ApplicationException {
  constructor() {
    super(1001,DomainErrorMessages.INVALID_CREDENTIALS);
  }
}
