import { ApplicationException } from './application.exception';

export class TokenExpiredException extends ApplicationException {
  constructor() {
    super(1002, 'El token ha expirado');
  }
}