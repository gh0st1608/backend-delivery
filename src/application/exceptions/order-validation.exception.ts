import { ApplicationException } from './application.exception';

// Reglas de negocio al crear/actualizar una orden (409: conflicto con el estado actual)
export class OrderValidationException extends ApplicationException {
  constructor(message: string) {
    super(1010, message, 'Orden inválida', 409);
  }
}
