import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AuthService,
  AuthServiceSymbol,
} from '../domain/services/auth.service';
import {
  RefreshTokenRepository,
  RefreshTokenRepositorySymbol,
} from '../domain/repository/refresh-token.repository';
import {
  UserRepository,
  UserRepositorySymbol,
} from '../domain/repository/user.repository';
import { AuthResponseDto } from './dto/response/response-custom.dto';
import { HttpStatusResponse } from '../domain/constants/http-code';
import { DomainSuccessMessages } from '../domain/constants/messages';
import { InvalidRefreshTokenException } from './exceptions/invalid-refresh-token.exception';
import { IssueTokensUseCase } from './issue-tokens.application';

@Injectable()
export class RefreshSessionUseCase {
  private readonly logger = new Logger(RefreshSessionUseCase.name);

  constructor(
    @Inject(AuthServiceSymbol)
    private readonly authService: AuthService,
    @Inject(RefreshTokenRepositorySymbol)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(UserRepositorySymbol)
    private readonly userRepository: UserRepository,
    private readonly issueTokensUseCase: IssueTokensUseCase,
  ) {}

  async execute(refreshToken?: string): Promise<AuthResponseDto> {
    if (!refreshToken) throw new InvalidRefreshTokenException();

    const stored = await this.refreshTokenRepository.findByHash(
      this.authService.hashToken(refreshToken),
    );

    if (!stored) throw new InvalidRefreshTokenException();

    const { familyId, userId, familyExpiresAt } = stored.properties();

    // 🚨 Reutilización: un token ya rotado/revocado volvió a usarse.
    // Puede ser robado → se invalida toda la sesión (OWASP).
    if (stored.isConsumed()) {
      this.logger.warn(
        `Reutilización de refresh token detectada. Familia revocada: ${familyId}`,
      );
      await this.refreshTokenRepository.revokeFamily(familyId);
      throw new InvalidRefreshTokenException();
    }

    if (stored.isExpired()) throw new InvalidRefreshTokenException();

    const user = await this.userRepository.findById(userId);
    if (!user || user.properties().active === false) {
      await this.refreshTokenRepository.revokeFamily(familyId);
      throw new InvalidRefreshTokenException();
    }

    // Rotación: el token presentado queda consumido y se emite uno nuevo
    const tokens = await this.issueTokensUseCase.execute(user, {
      familyId,
      familyExpiresAt,
    });

    stored.rotate(tokens.tokenHash);
    await this.refreshTokenRepository.save(stored);

    return {
      Auth: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
      statusCode: HttpStatusResponse.OK,
      message: DomainSuccessMessages.REFRESH_TOKEN_SUCCESS,
    };
  }
}
