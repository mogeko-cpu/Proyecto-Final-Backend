import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from './app';
import { createUsers } from './users';

describe('Inventario (e2e)', () => {
  let app: INestApplication;
  let u: Awaited<ReturnType<typeof createUsers>>;
  let depositId: string;
  let recordId: string;
  beforeAll(async () => {
    app = await createApp();
    u = await createUsers(app);
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  it('solo ADMIN configura depósitos y PUBLIC no ve el inventario', async () => {
    await request(app.getHttpServer()).get('/api/v1/records').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/records')
      .auth(u.visitor, { type: 'bearer' })
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/deposits')
      .auth(u.staff, { type: 'bearer' })
      .send({})
      .expect(403);
    const d = await request(app.getHttpServer())
      .post('/api/v1/deposits')
      .auth(u.admin, { type: 'bearer' })
      .send({
        name: `Depósito ${u.suffix}`,
        tempMin: 18,
        tempMax: 24,
        humidityMin: 40,
        humidityMax: 60,
      })
      .expect(201);
    depositId = d.body.id;
    await request(app.getHttpServer())
      .post('/api/v1/deposits')
      .auth(u.admin, { type: 'bearer' })
      .send({ name: 'Inválido', tempMin: 30, tempMax: 24, humidityMin: 40, humidityMax: 60 })
      .expect(400);
  });

  it('CRUD de expedientes, filtros, paginación y código único', async () => {
    const payload = {
      code: `TEST-${u.suffix}`,
      title: 'Actas de prueba',
      depositId,
      shelf: 'E1',
      box: 'C1',
      description: 'Datos ficticios',
      inspectionDays: 30,
    };
    const invalid = await request(app.getHttpServer())
      .post('/api/v1/records')
      .auth(u.staff, { type: 'bearer' })
      .send({ title: 'X', unexpected: true })
      .expect(400);
    expect(Array.isArray(invalid.body.message)).toBe(true);
    const r = await request(app.getHttpServer())
      .post('/api/v1/records')
      .auth(u.staff, { type: 'bearer' })
      .send(payload)
      .expect(201);
    recordId = r.body.id;
    await request(app.getHttpServer())
      .post('/api/v1/records')
      .auth(u.staff, { type: 'bearer' })
      .send(payload)
      .expect(409);
    await request(app.getHttpServer())
      .put(`/api/v1/records/${recordId}`)
      .auth(u.staff, { type: 'bearer' })
      .send({ ...payload, box: 'C2' })
      .expect(200);
    const list = await request(app.getHttpServer())
      .get(`/api/v1/records?q=TEST-${u.suffix}&limit=1&page=1&sort=title&order=ASC&archived=false`)
      .auth(u.staff, { type: 'bearer' })
      .expect(200);
    expect(list.body.total).toBe(1);
    expect(list.body.items[0].box).toBe('C2');
    await request(app.getHttpServer())
      .get('/api/v1/records?sort=invalid')
      .auth(u.staff, { type: 'bearer' })
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/records?limit=1000')
      .auth(u.staff, { type: 'bearer' })
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/records/not-a-uuid')
      .auth(u.staff, { type: 'bearer' })
      .expect(400);
  });

  it('solo ADMIN archiva y el expediente sale del inventario activo', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/records/${recordId}`)
      .auth(u.staff, { type: 'bearer' })
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/api/v1/records/${recordId}`)
      .auth(u.admin, { type: 'bearer' })
      .expect(200);
    const list = await request(app.getHttpServer())
      .get(`/api/v1/records?q=TEST-${u.suffix}&archived=false`)
      .auth(u.staff, { type: 'bearer' })
      .expect(200);
    expect(list.body.total).toBe(0);
    const detail = await request(app.getHttpServer())
      .get(`/api/v1/records/${recordId}`)
      .auth(u.staff, { type: 'bearer' })
      .expect(200);
    expect(detail.body.archived).toBe(true);
  });
});
