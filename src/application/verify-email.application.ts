// src/application/use-cases/login.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '../domain/repository/user.repository';
import { VerifiedEmailResponseDto } from './dto/response/response-custom.dto';
import { HttpStatusResponse } from '../domain/constants/http-code';
import { EmailInvalidException } from './exceptions/email-invalid.exception';
import { UserRepositorySymbol } from '../domain/repository/user.repository';
import { VerifyEmailDto } from './dto/request/verify-email.dto';
import {
  UserEventPublisher,
  UserEventPublisherSymbol,
} from '../domain/services/event.publisher';
import {
  AuthService,
  AuthServiceSymbol,
} from '../domain/services/auth.service';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(UserRepositorySymbol)
    private readonly userRepository: UserRepository,
    @Inject(UserEventPublisherSymbol)
    private readonly eventPublisher: UserEventPublisher,
    @Inject(AuthServiceSymbol)
    private readonly authService: AuthService,
  ) {}

  async execute(
    verifyEmail: VerifyEmailDto,
  ): Promise<VerifiedEmailResponseDto> {
    try {
      const { email } = verifyEmail.User;

      const user = await this.userRepository.findByEmail(email);
      console.log('user',user)
      if (!user) {
        throw new EmailInvalidException();
      }

      // 1) Generar código
      const code = this.authService.generateVerificationCode();

      // 2) Guardar código + TTL en DynamoDB
      const ttl = Math.floor(Date.now() / 1000) + 4 * 60; // 4 minutos

      const userUpdate = user.update({
        verificationCode: code,
        verificationCodeExpiresAt: ttl,
      });

      await this.userRepository.save(userUpdate);

      // 3) Publicar el evento a EventBridge
      await this.eventPublisher.publishEmailVerification({
        name: 'EmailVerify',
        payload: {
          email: email,
          subject: 'Código de verificación',
          message: `Su código de validación es: ${code}`,
        },
      });

      return {
        User: { verifyEmail: false }, // todavía no está verificado
        statusCode: HttpStatusResponse.OK,
        message: 'Código enviado correctamente',
      };
    } catch (error) {
      console.log('error', error);
    }
  }
}
