import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from './app';

describe('Base técnica (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createApp();
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  it('expone salud en /api/v1/health y /health', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', database: 'up' });
    await request(app.getHttpServer()).get('/health').expect(200);
  });

  it('publica Swagger y responde errores con formato uniforme', async () => {
    const docs = await request(app.getHttpServer()).get('/docs-json').expect(200);
    expect(docs.body.paths['/api/v1/health']).toBeDefined();
    const missing = await request(app.getHttpServer()).get('/api/v1/no-existe').expect(404);
    expect(missing.body).toMatchObject({ statusCode: 404, path: '/api/v1/no-existe' });
  });
});
