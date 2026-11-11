import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';

/** Levanta la API completa contra PostgreSQL real. Solo con una base cuyo nombre contenga "test". */
export async function createApp(): Promise<INestApplication> {
  if (!process.env.DATABASE_URL?.includes('test'))
    throw new Error(
      'E2E requiere una DATABASE_URL que contenga test para impedir usar datos reales',
    );
  process.env.SEED_DEMO = 'false';
  process.env.SCHEDULER_ENABLED = 'false';
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = module.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}
