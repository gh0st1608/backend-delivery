// src/application/use-cases/login.use-case.ts

import { Inject, Injectable } from '@nestjs/common';
import { IssueTokensUseCase } from './issue-tokens.application';
import { UserRepository } from '../domain/repository/user.repository';
import { AuthService } from '../../src/domain/services/auth.service';
import { LoginDto } from '../../src/application/dto/request/login.dto';
import { AuthResponseDto } from './dto/response/response-custom.dto';
import { HttpStatusResponse } from '../domain/constants/http-code';
import { DomainSuccessMessages } from '../domain/constants/messages';
import { LoginFailedException } from './exceptions/login-failed.exception';
import { AuthServiceSymbol } from '../domain/services/auth.service';
import { UserRepositorySymbol } from '../domain/repository/user.repository';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(UserRepositorySymbol)
    private readonly userRepository: UserRepository,

    @Inject(AuthServiceSymbol)
    private readonly authService: AuthService,
    private readonly issueTokensUseCase: IssueTokensUseCase,
  ) {}

  async execute(authLogin: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = authLogin.Auth;
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new LoginFailedException();
    }

    const isMatch = await this.authService.comparePasswords(
      password,
      user.properties().password,
    );

    if (!isMatch) {
      throw new LoginFailedException();
    }

    const { accessToken, refreshToken, expiresIn } =
      await this.issueTokensUseCase.execute(user);

    return {
      Auth: {
        accessToken,
        refreshToken,
        expiresIn,
      },
      statusCode: HttpStatusResponse.OK,
      message: DomainSuccessMessages.LOGIN_SUCESS,
    };
  }
}
