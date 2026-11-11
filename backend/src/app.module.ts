import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth.module';
import { CoreModule } from './modules/core.module';
import { HealthController } from './presentation/controllers/health.controller';

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]), CoreModule, AuthModule],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
