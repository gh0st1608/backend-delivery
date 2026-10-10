import { Inject, Injectable } from '@nestjs/common';
import {
  AuthService,
  AuthServiceSymbol,
} from '../domain/services/auth.service';
import {
  RefreshTokenRepository,
  RefreshTokenRepositorySymbol,
} from '../domain/repository/refresh-token.repository';
import { HttpStatusResponse } from '../domain/constants/http-code';
import { DomainSuccessMessages } from '../domain/constants/messages';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(AuthServiceSymbol)
    private readonly authService: AuthService,
    @Inject(RefreshTokenRepositorySymbol)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  // Idempotente: cerrar sesión con un token inválido no revela nada
  async execute(refreshToken?: string) {
    if (refreshToken) {
      const stored = await this.refreshTokenRepository.findByHash(
        this.authService.hashToken(refreshToken),
      );

      if (stored) {
        await this.refreshTokenRepository.revokeFamily(
          stored.properties().familyId,
        );
      }
    }

    return {
      statusCode: HttpStatusResponse.OK,
      message: DomainSuccessMessages.LOGOUT_SUCCESS,
    };
  }
}
