import { ApplicationException } from './application.exception';

export class UserAlreadyExistsException extends ApplicationException {
  constructor() {
    super(1004, 'El usuario ya está registrado');
  }
}
