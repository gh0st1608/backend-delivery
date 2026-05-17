import { InfraErrorMessages } from '../../domain/constants/messages';
import { InfrastructureException } from './infrastructure.exceptions';

export class DeleteFailedException extends InfrastructureException {
  constructor() {
    super(2001, InfraErrorMessages.DELETE_FAILED);
  }
}
