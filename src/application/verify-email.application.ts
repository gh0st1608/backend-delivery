// src/application/use-cases/login.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '../domain/repository/user.repository';
import {
  VerifiedEmailResponseDto,
} from './dto/response/response-custom.dto';
import { HttpStatusResponse } from '../domain/constants/http-code';
import { DomainSuccessMessages } from '../domain/constants/messages';
import { EmailInvalidException } from './exceptions/email-invalid.exception';
import { UserRepositorySymbol } from '../domain/repository/user.repository';
import { VerifyEmailDto } from './dto/request/verify-email.dto';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(UserRepositorySymbol)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(verifyEmail: VerifyEmailDto): Promise<VerifiedEmailResponseDto> {
    const { email } = verifyEmail.User;
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new EmailInvalidException();
    }

    return {
      User: {
        verifyEmail: true,
      },
      statusCode: HttpStatusResponse.OK,
      message: DomainSuccessMessages.EMAIL_VERIFIED,
    };
  }
}
