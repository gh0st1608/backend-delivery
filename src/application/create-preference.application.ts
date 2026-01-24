import { Inject, Injectable } from '@nestjs/common';
import {
  PreferenceRepository,
  PreferenceRepositorySymbol,
} from '../domain/repository/preference.repository';
import { Preference } from '../domain/preference.entity';
import { CreatePreferenceDto } from './dto/request/create-preference.dto';
import { CreatePreferenceResult } from './dto/response/response-custom.dto';
import { UserRepository, UserRepositorySymbol } from '../domain/repository/user.repository';
import { UserNotFoundException } from './exceptions/user-not-found.exception';

@Injectable()
export class CreatePreferencesUseCase {
  constructor(
    @Inject(PreferenceRepositorySymbol)
    private readonly preferenceRepository: PreferenceRepository,

    @Inject(UserRepositorySymbol)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: CreatePreferenceDto): Promise<CreatePreferenceResult> {
    const { userId, categoryIds } = input.Preference;

    const ids: string[] = [];

    for (const categoryId of categoryIds) {
      const preference = Preference.create({ userId, categoryId });
      const preferenceId = await this.preferenceRepository.save(preference);
      ids.push(preferenceId);
    }

    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new UserNotFoundException();
    }

    user.update({
      onboardingRequired: false,
    });

    await this.userRepository.save(user);

    return { ids };
  }
}

