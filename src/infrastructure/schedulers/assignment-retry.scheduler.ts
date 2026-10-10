import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { RetryPendingAssignmentsUseCase } from '../../application/use-cases/retry-pending-assignments.usecase';
import {
  SettingsRepository,
  SettingsRepositorySymbol,
} from '../../domain/repository/settings.repository';

/**
 * Solo en contenedor: reintenta asignaciones pendientes. El intervalo se
 * relee de Settings en cada ciclo, así un cambio desde la administración
 * aplica sin reiniciar. En Lambda se usa una regla programada (handler.ts).
 */
@Injectable()
export class AssignmentRetryScheduler
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(AssignmentRetryScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  private stopped = false;

  constructor(
    private readonly retryPendingAssignmentsUseCase: RetryPendingAssignmentsUseCase,
    @Inject(SettingsRepositorySymbol)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  onApplicationBootstrap() {
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) return;
    void this.scheduleNext();
  }

  onApplicationShutdown() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
  }

  private async scheduleNext() {
    if (this.stopped) return;

    const { assignment } = await this.settingsRepository.getDeliverySettings();

    this.timer = setTimeout(async () => {
      try {
        const { processed, assigned } =
          await this.retryPendingAssignmentsUseCase.execute();
        if (processed) {
          this.logger.log(`Reintentos de asignación: ${assigned}/${processed}`);
        }
      } catch (error) {
        this.logger.error(`Reintento de asignación falló: ${(error as Error).message}`);
      } finally {
        void this.scheduleNext();
      }
    }, assignment.retryIntervalSeconds * 1000);
  }
}
