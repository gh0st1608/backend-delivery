import { InfraErrorMessages } from '../../domain/constants/messages';
import { InfrastructureException } from './infrastructure.exceptions';

export class SaveFailedException extends InfrastructureException {
  constructor() {
    super(2000, InfraErrorMessages.SAVE_FAILED);
  }
}
