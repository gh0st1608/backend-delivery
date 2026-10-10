import { ApplicationException } from './application.exception';
import { DomainErrorMessages } from '../../domain/constants/messages';

// Evita usar el flujo de pago como redirección abierta (OWASP Unvalidated Redirects)
export class InvalidReturnUrlException extends ApplicationException {
  constructor() {
    super(3003, DomainErrorMessages.INVALID_RETURN_URL, 'Petición incorrecta', 400);
  }
}
