import { GetByParamsDto } from '../../application/dto/request/get-by-params.dto';
import { PaginatedResult } from '../../application/dto/response/response-custom.dto';
import { Preference } from '../preference.entity';

export interface PreferenceRepository {
  save(preference: Preference): Promise<string>;
  getList(query : GetByParamsDto): Promise<PaginatedResult<Preference>>;
}

export const PreferenceRepositorySymbol = Symbol('PreferenceRepository');