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
import { EventUserPublisherSymbol } from './domain/services/event.service';
import { EventUserPublisherImpl } from './infrastructure/events/sns.events.publisher';
import { VerifyEmailUseCase } from './application/verify-email.application';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${process.env.NODE_ENV || ''}.env`,
      isGlobal: true,
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RegisterUseCase,
    VerifyEmailUseCase,
    {
      provide: UserRepositorySymbol,
      useClass: UserRepositoryImpl,
    },
    {
      provide: AuthServiceSymbol,
      useClass: AuthServiceImpl,
    },
    {
      provide: EventUserPublisherSymbol,
      useClass: EventUserPublisherImpl,
    },
  ],
})
export class AuthModule {}
