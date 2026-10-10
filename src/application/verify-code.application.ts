import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '../domain/repository/user.repository';
import { UserRepositorySymbol } from '../domain/repository/user.repository';
import { HttpStatusResponse } from '../domain/constants/http-code';
import { EmailInvalidException } from './exceptions/email-invalid.exception';
import { VerifyCodeDto } from './dto/request/verify-code.dto';
import { VerifiedEmailResponseDto } from './dto/response/response-custom.dto';
import { VerificationCodeNotExistException } from './exceptions/verification-code-not-exist.exception';
import { VerificationCodeExpiredException } from './exceptions/verification-code-expired.exception';
import { VerificationCodeInvalidException } from './exceptions/verification-code-invalid.exception';
import { User } from '../domain/user.entity';

@Injectable()
export class VerifyCodeUseCase {
  constructor(
    @Inject(UserRepositorySymbol)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(dto: VerifyCodeDto): Promise<VerifiedEmailResponseDto> {
    const { email, code } = dto.User;

    const user = await this.validate(email, code);

    // El código NO se limpia aquí: set-password lo vuelve a exigir
    // y lo invalida al cambiar la contraseña.
    const userUpdated = user.update({
      active: true,
    });

    await this.userRepository.save(userUpdated);

    return {
      User: { verifyEmail: true },
      statusCode: HttpStatusResponse.OK,
      message: 'Email verificado correctamente',
    };
  }

  /**
   * Valida que el código exista, no haya expirado y coincida.
   * Reutilizado por SetPasswordUseCase.
   */
  async validate(email: string, code: string): Promise<User> {
    // 1) Buscar usuario
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new EmailInvalidException();
    }

    const props = user.properties();

    // 2) Validar existencia de código
    if (!props.verificationCode || !props.verificationCodeExpiresAt) {
      throw new VerificationCodeNotExistException();
    }

    // 3) Validar expiración
    const now = Math.floor(Date.now() / 1000);
    if (props.verificationCodeExpiresAt < now) {
      throw new VerificationCodeExpiredException();
    }

    // 4) Validar código ingresado
    if (props.verificationCode !== code) {
      throw new VerificationCodeInvalidException();
    }

    return user;
  }
}
