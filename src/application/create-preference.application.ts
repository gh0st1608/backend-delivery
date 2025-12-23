import { Inject, Injectable } from '@nestjs/common';
import {
  PreferenceRepository,
  PreferenceRepositorySymbol,
} from '../domain/repository/preference.repository';
import { Preference } from '../domain/preference.entity';
import { CreatePreferenceDto } from './dto/request/create-preference.dto';
import { CreatePreferenceResult } from './dto/response/response-custom.dto';

@Injectable()
export class CreatePreferencesUseCase {
  constructor(
    @Inject(PreferenceRepositorySymbol)
    private readonly repository: PreferenceRepository,
  ) {}

  async execute(input: CreatePreferenceDto): Promise<CreatePreferenceResult> {
    try {
      let arrIdsPref: string[] = [];
      const { userId, categoryIds } = input.Preference;
      for (const categoryId of categoryIds) {
        const preference = Preference.create({ userId, categoryId });
        const preferenceId = await this.repository.save(preference);
        arrIdsPref.push(preferenceId);
      }

      return { ids: arrIdsPref };
    } catch (error) {
      throw error;
    }
  }
}
