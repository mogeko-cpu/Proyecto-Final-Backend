import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Repository } from './domain/ports';
import { seed } from './infrastructure/seed';
import { AuthModule } from './modules/auth.module';
import { CoreModule } from './modules/core.module';
import { InterventionsModule } from './modules/interventions.module';
import { InventoryModule } from './modules/inventory.module';
import { MonitoringModule } from './modules/monitoring.module';
import { REPOSITORY } from './modules/tokens';
import { HealthController } from './presentation/controllers/health.controller';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    CoreModule,
    AuthModule,
    InventoryModule,
    MonitoringModule,
    InterventionsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements OnModuleInit {
  constructor(@Inject(REPOSITORY) private repo: Repository) {}
  /** Datos ficticios de demostración (SEED_DEMO=true). */
  async onModuleInit() {
    if (process.env.SEED_DEMO === 'true') await seed(this.repo);
  }
}
