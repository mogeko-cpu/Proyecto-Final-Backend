import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Health, ListItems } from '../application/common';
import { createDataSource, PgRepository } from '../infrastructure/database';
import { JwtSecurity, SystemRuntime } from '../infrastructure/security';
import { REPOSITORY, RUNTIME, SECURITY } from './tokens';
import { useCase } from './use-case';

/** Une los puertos del dominio con sus adaptadores (PostgreSQL, reloj del sistema y JWT). */
@Global()
@Module({
  providers: [
    {
      provide: DataSource,
      useFactory: async () => {
        const ds = createDataSource();
        await ds.initialize();
        await ds.runMigrations();
        return ds;
      },
    },
    {
      provide: REPOSITORY,
      useFactory: (ds: DataSource) => new PgRepository(ds),
      inject: [DataSource],
    },
    { provide: RUNTIME, useClass: SystemRuntime },
    {
      provide: SECURITY,
      useFactory: () =>
        new JwtSecurity(process.env.JWT_ACCESS_SECRET ?? '', process.env.JWT_REFRESH_SECRET ?? ''),
    },
    useCase(ListItems, REPOSITORY),
    useCase(Health, REPOSITORY),
  ],
  exports: [DataSource, REPOSITORY, RUNTIME, SECURITY, ListItems, Health],
})
export class CoreModule implements OnModuleDestroy {
  constructor(private ds: DataSource) {}
  async onModuleDestroy() {
    if (this.ds.isInitialized) await this.ds.destroy();
  }
}
