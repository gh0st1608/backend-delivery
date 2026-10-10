import { DomainErrorMessages } from '../../domain/constants/messages';
import { ApplicationException } from './application.exception';

// También se usa cuando la orden existe pero pertenece a otro usuario:
// responder 404 evita confirmar que el identificador existe (OWASP API1).
export class OrderNotFoundException extends ApplicationException {
  constructor() {
    super(1000, DomainErrorMessages.ORDER_NOT_FOUND, 'No encontrado', 404);
  }
}
