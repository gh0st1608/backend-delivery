import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '../domain/repository/user.repository';
import { AuthService } from '../domain/services/auth.service';
import { VerifiedEmailResponseDto } from './dto/response/response-custom.dto';
import { UserRepositorySymbol } from '../domain/repository/user.repository';
import { AuthServiceSymbol } from '../domain/services/auth.service';
import { HttpStatusResponse } from '../domain/constants/http-code';
import { DomainSuccessMessages } from '../domain/constants/messages';
import { SetPasswordDto } from './dto/request/set-password.dto';
import { VerifyCodeUseCase } from './verify-code.application';

@Injectable()
export class SetPasswordUseCase {
  constructor(
    @Inject(UserRepositorySymbol)
    private readonly userRepository: UserRepository,

    @Inject(AuthServiceSymbol)
    private readonly authService: AuthService,

    private readonly verifyCodeUseCase: VerifyCodeUseCase,
  ) {}

  async execute(setPasswordDto: SetPasswordDto): Promise<VerifiedEmailResponseDto> {
    try {
      const { email, password, code } = setPasswordDto.User;

      // Solo quien recibió el código por correo puede cambiar la contraseña
      const userFound = await this.verifyCodeUseCase.validate(email, code);

      const hashedNewPassword = await this.authService.hashPassword(password);

      // Se invalida el código para que no pueda reutilizarse
      const userUpdated = userFound.update({
        password: hashedNewPassword,
        verificationCode: '',
        verificationCodeExpiresAt: 0,
      });

      await this.userRepository.save(userUpdated);

      return {
        User: {
          verifyEmail : true,
        },
        statusCode: HttpStatusResponse.CREATED,
        message: DomainSuccessMessages.SET_PASSWORD_SUCCESS,
      };
    } catch (error) {
      throw error;
    }
  }
}
