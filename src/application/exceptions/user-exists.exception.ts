import { ApplicationException } from './application.exception';

export class UserAlreadyExistsException extends ApplicationException {
  constructor() {
    super(1002, 'El usuario ya está registrado');
  }
}