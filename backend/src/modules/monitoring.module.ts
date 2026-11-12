import { Logger, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EvaluateOverdue, IngestReading, RegisterInspection } from '../application/monitoring';
import { MonitoringController } from '../presentation/controllers/monitoring.controller';
import { REPOSITORY, RUNTIME } from './tokens';
import { useCase } from './use-case';

@Module({
  controllers: [MonitoringController],
  providers: [
    useCase(RegisterInspection, REPOSITORY, RUNTIME),
    useCase(IngestReading, REPOSITORY, RUNTIME),
    useCase(EvaluateOverdue, REPOSITORY, RUNTIME),
  ],
})
export class MonitoringModule implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private logger = new Logger('Scheduler');
  private busy = false;
  constructor(private overdue: EvaluateOverdue) {}

  /** HU09: evalúa inspecciones vencidas al arrancar y luego cada 60 segundos. */
  async onModuleInit() {
    if (process.env.SCHEDULER_ENABLED === 'false') return;
    await this.run();
    this.timer = setInterval(() => void this.run(), 60000);
    this.timer.unref();
  }
  private async run() {
    if (this.busy) return;
    this.busy = true;
    try {
      const result = await this.overdue.execute();
      this.logger.log({ event: 'overdue_evaluated', ...result });
    } catch {
      this.logger.error({ event: 'overdue_evaluation_failed' });
    } finally {
      this.busy = false;
    }
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
