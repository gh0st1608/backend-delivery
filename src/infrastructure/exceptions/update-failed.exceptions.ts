import { InfraErrorMessages } from '../../domain/constants/messages';
import { InfrastructureException } from './infrastructure.exceptions';

export class UpdateFailedException extends InfrastructureException {
  constructor() {
    super(2001, InfraErrorMessages.UPDATE_FAILED);
  }
}
