import { DomainErrorMessages } from '../../domain/constants/messages';
import { ApplicationException } from './application.exception';

// 401: el cliente debe volver a iniciar sesión.
// El mensaje es genérico a propósito (no revela si el token expiró, fue
// revocado o reutilizado).
export class InvalidRefreshTokenException extends ApplicationException {
  constructor() {
    super(
      1010,
      DomainErrorMessages.INVALID_REFRESH_TOKEN,
      'No autorizado',
      401,
    );
  }
}
