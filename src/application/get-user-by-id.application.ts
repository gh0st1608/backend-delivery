import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '../domain/repository/user.repository';
import { UserRepositorySymbol } from '../domain/repository/user.repository';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { GetUserResult } from './dto/response/response-custom.dto';
import {
  PublicUserDto,
  toUserResponse,
} from './dto/response/user-response.dto';

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject(UserRepositorySymbol)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string): Promise<GetUserResult<PublicUserDto>> {
    try {
      const user = await this.userRepository.findById(id);

      if (!user) {
        throw new UserNotFoundException();
      }

      return {
        user: toUserResponse(user),
      };
    } catch (error) {
      throw error;
    }
  }
}
