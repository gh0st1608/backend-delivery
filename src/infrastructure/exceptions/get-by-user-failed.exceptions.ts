import { InfraErrorMessages } from '../../domain/constants/messages';
import { InfrastructureException } from './infrastructure.exceptions';

export class GetByUserFailedException extends InfrastructureException {
  constructor() {
    super(2002, InfraErrorMessages.GET_FAILED);
  }
}
