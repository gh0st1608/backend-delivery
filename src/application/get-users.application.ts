import { Inject, Injectable } from '@nestjs/common';
import { GetByParamsDto } from './dto/request/get-by-params.dto';
import { GetUsersResult } from './dto/response/response-custom.dto';
import { toUserResponse } from './dto/response/user-response.dto';
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
    return { items: items.map(toUserResponse), count, nextCursor };
  }
}
