import { Inject, Injectable } from '@nestjs/common';
import { PaymentRepository, PaymentRepositorySymbol } from '../../domain/repository/payment.repository';
import { GetByParamsDto } from '../dto/request/get-by-params.dto';
import { GetPaymentsResult } from '../dto/response/response-custom.dto';

@Injectable()
export class GetPaymentsUseCase {
  constructor(
    @Inject(PaymentRepositorySymbol)
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(query: GetByParamsDto): Promise<GetPaymentsResult> {
    return this.paymentRepository.getList(query);
  }
}
