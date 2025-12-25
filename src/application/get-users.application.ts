import { Inject, Injectable } from '@nestjs/common';
import { PreferenceRepositorySymbol } from '../domain/repository/preference.repository';
import { GetByParamsDto } from './dto/request/get-by-params.dto';
import { GetUsersResult } from './dto/response/response-custom.dto';
import {
  UserRepository,
  UserRepositorySymbol,
} from '../domain/repository/user.repository';

@Injectable()
export class GetUsersUseCase {
  constructor(
    @Inject(UserRepositorySymbol)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(query: GetByParamsDto): Promise<GetUsersResult> {
    const { items, count, nextCursor } =
      await this.userRepository.getList(query);
    return { items, count, nextCursor };
  }
}
