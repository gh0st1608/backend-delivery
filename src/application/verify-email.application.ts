// src/application/use-cases/login.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '../domain/repository/user.repository';
import { VerifiedEmailResponseDto } from './dto/response/response-custom.dto';
import { HttpStatusResponse } from '../domain/constants/http-code';
import { DomainSuccessMessages } from '../domain/constants/messages';
import { EmailInvalidException } from './exceptions/email-invalid.exception';
import { UserRepositorySymbol } from '../domain/repository/user.repository';
import { VerifyEmailDto } from './dto/request/verify-email.dto';
import {
  UserEventPublisher,
  UserEventPublisherSymbol,
} from '../domain/services/event.publisher';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(UserRepositorySymbol)
    private readonly userRepository: UserRepository,
    @Inject(UserEventPublisherSymbol)
    private readonly eventPublisher: UserEventPublisher,
  ) {}

  async execute(
    verifyEmail: VerifyEmailDto,
  ): Promise<VerifiedEmailResponseDto> {
    try {
      const { email } = verifyEmail.User;
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new EmailInvalidException();
      }

      await this.eventPublisher.publishEmailVerification({
        name: 'EmailVerify',
        payload: {
          email: email,
          subject: 'Bienvenido a la plataforma',
          message: 'Tu cuenta ha sido creada correctamente'
        },
      });

      return {
        User: {
          verifyEmail: true,
        },
        statusCode: HttpStatusResponse.OK,
        message: DomainSuccessMessages.EMAIL_VERIFIED,
      };
    } catch (error) {
      console.error('❌ Error en VerifyEmailCase.execute():', error);
      throw error;
    }
  }
}
