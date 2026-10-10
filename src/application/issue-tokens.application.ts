import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AuthService,
  AuthServiceSymbol,
} from '../domain/services/auth.service';
import {
  RefreshTokenRepository,
  RefreshTokenRepositorySymbol,
} from '../domain/repository/refresh-token.repository';
import { RefreshToken } from '../domain/refresh-token.entity';
import { User } from '../domain/user.entity';
import { Tokens } from '../domain/interfaces/tokens.interface';
import { jwtConfig } from '../infrastructure/config/jwt.config';

/**
 * Emite el par access/refresh token.
 * - Sin familyId: inicia una sesión nueva (login / registro).
 * - Con familyId: rotación dentro de una sesión existente (refresh).
 */
@Injectable()
export class IssueTokensUseCase {
  constructor(
    @Inject(AuthServiceSymbol)
    private readonly authService: AuthService,
    @Inject(RefreshTokenRepositorySymbol)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(
    user: User,
    session?: { familyId: string; familyExpiresAt: Date },
  ): Promise<Tokens & { tokenHash: string }> {
    const { refreshTokenTtlSeconds, refreshFamilyMaxSeconds, accessTokenTtlSeconds } =
      jwtConfig();

    const refreshToken = this.authService.generateRefreshToken();
    const tokenHash = this.authService.hashToken(refreshToken);

    const familyId = session?.familyId ?? randomUUID();
    const familyExpiresAt =
      session?.familyExpiresAt ??
      new Date(Date.now() + refreshFamilyMaxSeconds * 1000);

    await this.refreshTokenRepository.save(
      RefreshToken.create({
        tokenHash,
        familyId,
        userId: user.properties().userId,
        ttlSeconds: refreshTokenTtlSeconds,
        familyExpiresAt,
      }),
    );

    return {
      accessToken: this.authService.generateAccessToken(user),
      refreshToken,
      expiresIn: accessTokenTtlSeconds,
      tokenHash,
    };
  }
}
