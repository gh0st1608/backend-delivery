import { DomainErrorMessages } from '../../domain/constants/messages';
import { ApplicationException } from './application.exception';

export class ForbiddenResourceException extends ApplicationException {
  constructor() {
    super(
      1011,
      DomainErrorMessages.FORBIDDEN_RESOURCE,
      'Acceso prohibido',
      403,
    );
  }
}
