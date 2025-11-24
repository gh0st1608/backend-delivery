import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '../domain/repository/user.repository';
import { AuthService } from '../domain/services/auth.service';
import { VerifiedEmailResponseDto } from './dto/response/response-custom.dto';
import { UserRepositorySymbol } from '../domain/repository/user.repository';
import { AuthServiceSymbol } from '../domain/services/auth.service';
import { UserAlreadyExistsException } from './exceptions/user-exists.exception';
import { HttpStatusResponse } from '../domain/constants/http-code';
import { DomainSuccessMessages } from '../domain/constants/messages';
import { SetPasswordDto } from './dto/request/set-password.dto';

@Injectable()
export class SetPasswordUseCase {
  constructor(
    @Inject(UserRepositorySymbol)
    private readonly userRepository: UserRepository,

    @Inject(AuthServiceSymbol)
    private readonly authService: AuthService,
  ) {}

  async execute(setPasswordDto: SetPasswordDto): Promise<VerifiedEmailResponseDto> {
    try {
      const { email, password } = setPasswordDto.User;

      const userFound = await this.userRepository.findByEmail(email);

      const hashedNewPassword = await this.authService.hashPassword(password);

      const userUpdated = userFound.update({
        password: hashedNewPassword
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
      console.error('❌ Error en RegisterUseCase.execute():', error);
      throw error;
    }
  }
}
