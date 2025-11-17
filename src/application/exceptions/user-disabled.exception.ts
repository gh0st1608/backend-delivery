import { ApplicationException } from './application.exception';

export class UserDisabledException extends ApplicationException {
  constructor() {
    super(1003, 'El usuario está deshabilitado');
  }
}