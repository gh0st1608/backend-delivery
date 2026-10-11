import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SendEmailUseCase } from './application/send-email.application';
import { EmailRepositorySymbol } from './domain/repository/email.repository';
import { EmailRepositoryImpl } from './infrastructure/repository/email.repository.impl';
import { SesProvider } from './infrastructure/provider/ses.provider';
import { SQSEmailConsumer } from './infrastructure/consumer/sqs-email.consumer';
import { NotificationController } from './infrastructure/controller/sqs.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      // .env.local por defecto; .env.production con NODE_ENV=production
      envFilePath: `.env.${process.env.NODE_ENV || 'local'}`,
      isGlobal: true,
    }),
  ],
  controllers: [NotificationController],
  providers: [
    SendEmailUseCase,
    SesProvider,
    SQSEmailConsumer,
    {
      provide: EmailRepositorySymbol,
      useClass: EmailRepositoryImpl,
    },
  ],
})
export class NotificationModule {}
