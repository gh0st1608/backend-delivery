import { Inject, Injectable } from '@nestjs/common';
import { PreferenceRepository, PreferenceRepositorySymbol } from '../domain/repository/preference.repository';
import { GetByParamsDto } from './dto/request/get-by-params.dto';
import { GetPreferencesResult } from './dto/response/response-custom.dto';
import { PreferenceRepositoryImpl } from '../infrastructure/repository/preference.repository.impl';

@Injectable()
export class GetPreferencesUseCase {
  constructor(
    @Inject(PreferenceRepositorySymbol)
    private readonly preferenceRepository: PreferenceRepository,
  ) {}

  async execute(query: GetByParamsDto): Promise<GetPreferencesResult> {
    const { items, count, nextCursor } =
      await this.preferenceRepository.getList(query);

    return { items, count, nextCursor };
  }
}
