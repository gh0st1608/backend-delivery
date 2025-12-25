import { ApplicationException } from './application.exception';

export class UserNotFoundException extends ApplicationException {
  constructor() {
    super(1005, 'El usuario no existe');
  }
}
