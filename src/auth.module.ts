// src/infrastructure/modules/auth.module.ts

import { Module } from '@nestjs/common';
import { LoginUseCase } from './application/login.application';
import { UserRepositoryImpl } from './infrastructure/repository/user.repository.impl';
import { AuthController } from './infrastructure/auth.controller';
import { UserRepositorySymbol } from './domain/repository/user.repository';
import { AuthServiceSymbol } from './domain/services/auth.service';
import { AuthServiceImpl } from './infrastructure/services/auth.service.impl';
import { ConfigModule } from '@nestjs/config';
import { RegisterUseCase } from './application/register.application';
import { UserEventPublisherSymbol } from './domain/services/event.publisher';
import { VerifyEmailUseCase } from './application/verify-email.application';
import { EventBridgeUserEventPublisher } from './infrastructure/events/eventbridge-user-event.publisher';
import { VerifyCodeUseCase } from './application/verify-code.application';
import { SetPasswordUseCase } from './application/set-password.application';
import { PreferenceRepositoryImpl } from './infrastructure/repository/preference.repository.impl';
import { PreferenceRepositorySymbol } from './domain/repository/preference.repository';
import { CreatePreferencesUseCase } from './application/create-preference.application';
import { GetPreferencesUseCase } from './application/get-preference.application';
import { GetUsersUseCase } from './application/get-users.application';
import { GetUserByIdUseCase } from './application/get-user-by-id.application';
import { GetMeUseCase } from './application/get-me.application';
import { AccessTokenStrategy } from './infrastructure/access-token.strategy';
import { AccessTokenGuard } from './infrastructure/access-token.guard';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'access-token' }),
    ConfigModule.forRoot({
      envFilePath: `${process.env.NODE_ENV || ''}.env`,
      isGlobal: true,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AccessTokenStrategy,
    LoginUseCase,
    RegisterUseCase,
    VerifyEmailUseCase,
    VerifyCodeUseCase,
    SetPasswordUseCase,
    CreatePreferencesUseCase,
    GetPreferencesUseCase,
    GetUsersUseCase,
    GetUserByIdUseCase,
    GetMeUseCase,
    {
      provide: UserRepositorySymbol,
      useClass: UserRepositoryImpl,
    },
    {
      provide: AuthServiceSymbol,
      useClass: AuthServiceImpl,
    },
    {
      provide: UserEventPublisherSymbol,
      useClass: EventBridgeUserEventPublisher,
    },
    {

      provide: PreferenceRepositorySymbol,
      useClass: PreferenceRepositoryImpl
    }
  ],
})
export class AuthModule {}
