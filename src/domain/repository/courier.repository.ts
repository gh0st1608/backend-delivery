import { GetByParamsDto } from '../../application/dto/request/get-by-params.dto';
import { PaginatedResult } from '../../application/dto/response/response-custom.dto';
import { Courier } from '../../domain/courier.entity';

export interface CourierRepository {
  getById(id: string): Promise<Courier | null>;
  getList(query: GetByParamsDto): Promise<PaginatedResult<Courier>>;
  findAvailable(limit: number, maxLocationAgeSeconds: number): Promise<Courier[]>;
  save(courier: Courier): Promise<string>;
}

export const CourierRepositorySymbol = Symbol('CourierRepository');
