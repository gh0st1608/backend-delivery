import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '../domain/repository/user.repository';
import { UserRepositorySymbol } from '../domain/repository/user.repository';
import { AuthService, AuthServiceSymbol } from '../domain/services/auth.service';
import { HttpStatusResponse } from '../domain/constants/http-code';
import { EmailInvalidException } from './exceptions/email-invalid.exception';
import { VerifyCodeDto } from './dto/request/verify-code.dto';
import { VerifiedEmailResponseDto } from './dto/response/response-custom.dto';

@Injectable()
export class VerifyCodeUseCase {
  constructor(
    @Inject(UserRepositorySymbol)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(dto: VerifyCodeDto): Promise<VerifiedEmailResponseDto> {
    const { email, code } = dto.User;

    // 1) Buscar usuario
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new EmailInvalidException();
    }

    const props = user.properties();

    // 2) Validar existencia de código
    if (!props.verificationCode || !props.verificationCodeExpiresAt) {
      return {
        User: { verifyEmail: false },
        statusCode: HttpStatusResponse.BAD_REQUEST,
        message: 'No existe ningún código activo para este usuario',
      };
    }

    // 3) Validar expiración
    const now = Math.floor(Date.now() / 1000);
    if (props.verificationCodeExpiresAt < now) {
      return {
        User: { verifyEmail: false },
        statusCode: HttpStatusResponse.BAD_REQUEST,
        message: 'El código ha expirado',
      };
    }

    // 4) Validar código ingresado
    if (props.verificationCode !== code) {
      return {
        User: { verifyEmail: false },
        statusCode: HttpStatusResponse.BAD_REQUEST,
        message: 'El código ingresado es incorrecto',
      };
    }

    // 5) Limpiar valores (ya verificado)
    const userUpdated = user.update({
      verificationCode: '',
      verificationCodeExpiresAt: 0,
      active: true, // si deseas activar el usuario aquí
    });

    await this.userRepository.save(userUpdated);

    return {
      User: { verifyEmail: true },
      statusCode: HttpStatusResponse.OK,
      message: 'Email verificado correctamente',
    };
  }
}
