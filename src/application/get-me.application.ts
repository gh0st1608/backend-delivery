import { Injectable } from '@nestjs/common';
import { GetUserByIdUseCase } from './get-user-by-id.application';

@Injectable()
export class GetMeUseCase {
  constructor(
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
  ) {}

  async execute(userId: string) {
    return this.getUserByIdUseCase.execute(userId);
  }
}