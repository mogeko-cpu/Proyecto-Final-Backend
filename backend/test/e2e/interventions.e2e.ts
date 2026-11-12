import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from './app';
import { createUsers } from './users';

describe('Intervenciones y dashboard (e2e)', () => {
  let app: INestApplication;
  let u: Awaited<ReturnType<typeof createUsers>>;
  let recordId: string;
  let alertId: string;
  beforeAll(async () => {
    app = await createApp();
    u = await createUsers(app);
    const d = await request(app.getHttpServer())
      .post('/api/v1/deposits')
      .auth(u.admin, { type: 'bearer' })
      .send({
        name: `Tareas ${u.suffix}`,
        tempMin: 18,
        tempMax: 24,
        humidityMin: 40,
        humidityMax: 60,
      })
      .expect(201);
    const r = await request(app.getHttpServer())
      .post('/api/v1/records')
      .auth(u.staff, { type: 'bearer' })
      .send({
        code: `TAR-${u.suffix}`,
        title: 'Expediente a intervenir',
        depositId: d.body.id,
        shelf: 'E1',
        box: 'C1',
        description: 'Datos ficticios',
        inspectionDays: 30,
      })
      .expect(201);
    recordId = r.body.id;
    await request(app.getHttpServer())
      .post(`/api/v1/records/${recordId}/inspections`)
      .auth(u.staff, { type: 'bearer' })
      .send({
        condition: 'CRITICO',
        notes: 'Daño crítico de prueba',
        pests: true,
        wear: true,
        moisture: false,
      })
      .expect(201);
    const alerts = await request(app.getHttpServer())
      .get(`/api/v1/alerts?recordId=${recordId}&status=OPEN`)
      .auth(u.staff, { type: 'bearer' })
      .expect(200);
    alertId = alerts.body.items[0].id;
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  it('asigna una intervención sin duplicados, avanza paso a paso y exige evidencia', async () => {
    const payload = {
      alertId,
      assigneeId: u.staffId,
      title: 'Aislar y evaluar expediente',
      dueAt: new Date(Date.now() + 86400000).toISOString(),
    };
    const task = await request(app.getHttpServer())
      .post('/api/v1/tasks')
      .auth(u.admin, { type: 'bearer' })
      .send(payload)
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/tasks')
      .auth(u.admin, { type: 'bearer' })
      .send(payload)
      .expect(409);
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.body.id}`)
      .auth(u.staff, { type: 'bearer' })
      .send({ status: 'DONE', resolution: 'Se documentó y completó la intervención' })
      .expect(409);
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.body.id}`)
      .auth(u.staff, { type: 'bearer' })
      .send({ status: 'IN_PROGRESS', resolution: '' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.body.id}`)
      .auth(u.staff, { type: 'bearer' })
      .send({ status: 'DONE', resolution: '' })
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/api/v1/tasks/${task.body.id}`)
      .auth(u.staff, { type: 'bearer' })
      .send({ status: 'DONE', resolution: 'Se documentó y completó la intervención' })
      .expect(200);
    const alerts = await request(app.getHttpServer())
      .get(`/api/v1/alerts?recordId=${recordId}&status=OPEN`)
      .auth(u.staff, { type: 'bearer' })
      .expect(200);
    expect(alerts.body.total).toBe(1);
  });

  it('el dashboard muestra alertas priorizadas y excluye expedientes archivados', async () => {
    const before = await request(app.getHttpServer())
      .get('/api/v1/dashboard')
      .auth(u.staff, { type: 'bearer' })
      .expect(200);
    expect(
      before.body.prioritizedAlerts.some((a: { recordId: string }) => a.recordId === recordId),
    ).toBe(true);
    await request(app.getHttpServer())
      .get('/api/v1/dashboard')
      .auth(u.visitor, { type: 'bearer' })
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/api/v1/records/${recordId}`)
      .auth(u.admin, { type: 'bearer' })
      .expect(200);
    const after = await request(app.getHttpServer())
      .get('/api/v1/dashboard')
      .auth(u.admin, { type: 'bearer' })
      .expect(200);
    expect(
      after.body.prioritizedAlerts.every((a: { recordId: string }) => a.recordId !== recordId),
    ).toBe(true);
  });
});
