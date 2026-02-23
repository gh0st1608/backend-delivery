import { Inject, Injectable } from '@nestjs/common';
import { GetByParamsDto } from '../dto/request/get-by-params.dto';
import { GetCouriersResult } from '../dto/response/response-custom.dto';
import { CourierRepository, CourierRepositorySymbol } from '../../domain/repository/courier.repository';

@Injectable()
export class GetCouriersUseCase {
  constructor(
    @Inject(CourierRepositorySymbol)
    private readonly courierRepository: CourierRepository,
  ) {}

  async execute(query: GetByParamsDto): Promise<GetCouriersResult> {
    const { items, count, nextCursor } =
      await this.courierRepository.getList(query);
    return { items, count, nextCursor };
  }
}
