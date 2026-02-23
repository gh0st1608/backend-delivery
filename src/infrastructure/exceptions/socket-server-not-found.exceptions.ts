import { InfraErrorMessages } from '../../domain/constants/messages';
import { InfrastructureException } from './infrastructure.exceptions';

export class SocketServerNotFoundException extends InfrastructureException {
  constructor() {
    super(2000, InfraErrorMessages.SERVER_WEBSOCKET_NOT_FOUND);
  }
}
