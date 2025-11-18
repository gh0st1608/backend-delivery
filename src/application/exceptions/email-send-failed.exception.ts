import { ApplicationException } from './application.exception';

export class EmailSendFailedException extends ApplicationException {
  constructor() {
    super(2000, 'Envio de correo fallido');
  }
}
