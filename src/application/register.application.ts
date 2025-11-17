import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '../domain/repository/user.repository';
import { AuthService } from '../domain/services/auth.service';
import { RegisterDto } from '../application/dto/request/register.dto';
import { AuthResponseDto } from '../application/dto/response/response-custom.dto';
import { UserRepositorySymbol } from '../domain/repository/user.repository';
import { AuthServiceSymbol } from '../domain/services/auth.service';
import { UserAlreadyExistsException } from '../application/exceptions/user-exists.exception';
import { HttpStatusResponse } from '../domain/constants/http-code';
import { DomainSuccessMessages } from '../domain/constants/messages';
import { User } from '../domain/user.entity';
import {
  EventUserPublisher,
  EventUserPublisherSymbol,
} from '../domain/services/event.service';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(UserRepositorySymbol)
    private readonly userRepository: UserRepository,

    @Inject(AuthServiceSymbol)
    private readonly authService: AuthService,

    @Inject(EventUserPublisherSymbol)
    private readonly eventPublisher: EventUserPublisher,
  ) {}

  async execute(registerDto: RegisterDto): Promise<AuthResponseDto> {
    try {
      const { email, password, fullname } = registerDto.User;

      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new UserAlreadyExistsException();
      }

      const hashedPassword = await this.authService.hashPassword(password);

      const user = User.create({
        name: fullname,
        email,
        password: hashedPassword,
        roles: 'user',
      });

      await this.userRepository.save(user);

      // ⚠️ Aquí publicamos el evento
      await this.eventPublisher.publish({
        name: 'UserRegistered',
        payload: {
          userId: user.properties().id,
          email: email,
        },
      });

      const accessToken = this.authService.generateAccessToken(user);
      const refreshToken = this.authService.generateRefreshToken(user);

      return {
        Auth: {
          accessToken,
          refreshToken,
        },
        statusCode: HttpStatusResponse.CREATED,
        message: DomainSuccessMessages.REGISTER_SUCCESS,
      };
    } catch (error) {
      console.error('❌ Error en RegisterUseCase.execute():', error);
      throw error;
    }
  }
}
