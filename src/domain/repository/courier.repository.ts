import { GetByParamsDto } from '../../application/dto/request/get-by-params.dto';
import { PaginatedResult } from '../../application/dto/response/response-custom.dto';
import { Courier } from '../../domain/courier.entity';

export interface CourierRepository {
  getById(id: string): Promise<Courier>;
  getList(query: GetByParamsDto): Promise<PaginatedResult<Courier>>;
  save(courier: Courier): Promise<string>;
}

export const CourierRepositorySymbol = Symbol('CourierRepository');
