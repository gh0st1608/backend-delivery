import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { setupApp } from './setup';
import { createServer, proxy } from 'aws-serverless-express';
import { Handler } from 'aws-lambda';
import { PaymentEventsConsumer } from './infrastructure/messaging/sqs/payment-events.consumer';
import { RetryPendingAssignmentsUseCase } from './application/use-cases/retry-pending-assignments.usecase';

let cachedApp: INestApplication | null = null;
let cachedServer: any;

async function bootstrapApp() {
  if (!cachedApp) {
    cachedApp = await NestFactory.create(AppModule);
    await setupApp(cachedApp);
    await cachedApp.init();
  }
  return cachedApp;
}

const isSqsEvent = (event: any) =>
  Array.isArray(event?.Records) && event.Records[0]?.eventSource === 'aws:sqs';

// Regla programada de EventBridge para reintentar asignaciones pendientes
const isScheduledEvent = (event: any) =>
  event?.source === 'aws.events' && event?.['detail-type'] === 'Scheduled Event';

export const handler: Handler = async (event, context) => {
  const app = await bootstrapApp();

  // 📨 Eventos de dominio (PaymentApproved) desde SQS
  if (isSqsEvent(event)) {
    const { failedMessageIds } = await app.get(PaymentEventsConsumer).handle(
      event.Records.map((record: any) => ({
        messageId: record.messageId,
        body: record.body,
      })),
    );

    // Requiere "ReportBatchItemFailures" en el trigger: solo se reintentan los fallidos
    return {
      batchItemFailures: failedMessageIds.map((id) => ({ itemIdentifier: id })),
    };
  }

  // ⏰ Reintento periódico de asignación de repartidores
  if (isScheduledEvent(event)) {
    return app.get(RetryPendingAssignmentsUseCase).execute();
  }

  // 🌐 API HTTP
  if (!cachedServer) {
    cachedServer = createServer(app.getHttpAdapter().getInstance());
  }

  return proxy(cachedServer, event, context, 'PROMISE').promise;
};
