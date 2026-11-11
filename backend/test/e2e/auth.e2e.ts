import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from './app';
import { createUsers, password } from './users';

describe('Autenticación y roles (e2e)', () => {
  let app: INestApplication;
  let u: Awaited<ReturnType<typeof createUsers>>;
  beforeAll(async () => {
    app = await createApp();
    u = await createUsers(app);
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  it('exige sesión y respeta los roles', async () => {
    const denied = await request(app.getHttpServer()).get('/api/v1/users').expect(401);
    expect(denied.body).toMatchObject({ statusCode: 401, path: '/api/v1/users' });
    await request(app.getHttpServer())
      .get('/api/v1/users')
      .auth(u.visitor, { type: 'bearer' })
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .auth(u.staff, { type: 'bearer' })
      .send({})
      .expect(403);
    const list = await request(app.getHttpServer())
      .get('/api/v1/users?limit=100')
      .auth(u.admin, { type: 'bearer' })
      .expect(200);
    expect(list.body.items[0].passwordHash).toBeUndefined();
    await request(app.getHttpServer()).get('/api/v1/health').expect(200);
  });

  it('credenciales incorrectas devuelven 401 sin decir qué falló', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'nadie@example.com', password: 'otra-clave' })
      .expect(401);
    expect(res.body.message).toBe('Credenciales incorrectas');
  });

  it('registro público no escala rol, refresh es de un solo uso y la cuenta se puede eliminar', async () => {
    const payload = {
      name: 'Visitante nuevo',
      email: `nuevo-${u.suffix}@example.com`,
      password,
      consent: true,
    };
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ ...payload, role: 'ADMIN' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ ...payload, consent: false })
      .expect(400);
    const created = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(payload)
      .expect(201);
    expect(created.body.role).toBe('PUBLIC');
    expect(created.body.passwordHash).toBeUndefined();
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: payload.email, password })
      .expect(201);
    const refreshed = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
    await request(app.getHttpServer())
      .delete('/api/v1/auth/account')
      .auth(refreshed.body.accessToken, { type: 'bearer' })
      .send({ password })
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .auth(refreshed.body.accessToken, { type: 'bearer' })
      .expect(401);
  });
});
