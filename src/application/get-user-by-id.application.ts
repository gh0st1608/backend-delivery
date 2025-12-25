import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '../domain/repository/user.repository';
import { UserRepositorySymbol } from '../domain/repository/user.repository';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { GetUserResult } from './dto/response/response-custom.dto';
import { User } from '../domain/user.entity';

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject(UserRepositorySymbol)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string): Promise<GetUserResult<User>> {
    try {
      const user = await this.userRepository.findById(id);

      if (!user) {
        throw new UserNotFoundException();
      }

      return {
        user,
      };
    } catch (error) {
      throw error;
    }
  }
}
