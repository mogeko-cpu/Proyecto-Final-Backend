import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createApp } from './app';
import { createUsers } from './users';

describe('Inspecciones, lecturas y alertas (e2e)', () => {
  let app: INestApplication;
  let u: Awaited<ReturnType<typeof createUsers>>;
  let depositId: string;
  let recordId: string;
  beforeAll(async () => {
    app = await createApp();
    u = await createUsers(app);
    const d = await request(app.getHttpServer())
      .post('/api/v1/deposits')
      .auth(u.admin, { type: 'bearer' })
      .send({
        name: `Monitoreo ${u.suffix}`,
        tempMin: 18,
        tempMax: 24,
        humidityMin: 40,
        humidityMax: 60,
      })
      .expect(201);
    depositId = d.body.id;
    const r = await request(app.getHttpServer())
      .post('/api/v1/records')
      .auth(u.staff, { type: 'bearer' })
      .send({
        code: `MON-${u.suffix}`,
        title: 'Expediente monitoreado',
        depositId,
        shelf: 'E1',
        box: 'C1',
        description: 'Datos ficticios',
        inspectionDays: 30,
      })
      .expect(201);
    recordId = r.body.id;
  });
  afterAll(async () => {
    if (app) await app.close();
  });

  it('inspección crítica concurrente no duplica alertas y conserva el historial', async () => {
    const payload = {
      condition: 'CRITICO',
      notes: 'Humedad y desgaste observados en la inspección',
      pests: false,
      wear: true,
      moisture: true,
    };
    await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .post(`/api/v1/records/${recordId}/inspections`)
          .auth(u.staff, { type: 'bearer' })
          .send(payload)
          .expect(201),
      ),
    );
    const alerts = await request(app.getHttpServer())
      .get(`/api/v1/alerts?recordId=${recordId}&status=OPEN`)
      .auth(u.staff, { type: 'bearer' })
      .expect(200);
    expect(alerts.body.total).toBe(1);
    const history = await request(app.getHttpServer())
      .get(`/api/v1/records/${recordId}/inspections`)
      .auth(u.staff, { type: 'bearer' })
      .expect(200);
    expect(history.body.total).toBe(2);
    expect(history.body.items[0].inspectorId).toBe(u.staffId);
  });

  it('lectura fuera de rango abre alerta; una normal la resuelve y una atrasada no la cambia', async () => {
    const reading = {
      depositId,
      sensorId: 'TEST-SIM',
      temperature: 28,
      humidity: 70,
      measuredAt: new Date().toISOString(),
    };
    await request(app.getHttpServer())
      .post('/api/v1/readings')
      .auth(u.staff, { type: 'bearer' })
      .send({ ...reading, humidity: 101 })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/readings')
      .auth(u.visitor, { type: 'bearer' })
      .send(reading)
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/readings')
      .auth(u.staff, { type: 'bearer' })
      .send(reading)
      .expect(201);
    let list = await request(app.getHttpServer())
      .get(`/api/v1/alerts?depositId=${depositId}&status=OPEN`)
      .auth(u.staff, { type: 'bearer' })
      .expect(200);
    expect(list.body.items.some((a: { kind: string }) => a.kind === 'ENVIRONMENT')).toBe(true);
    await request(app.getHttpServer())
      .post('/api/v1/readings')
      .auth(u.staff, { type: 'bearer' })
      .send({ ...reading, temperature: 22, humidity: 50, measuredAt: new Date().toISOString() })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/readings')
      .auth(u.staff, { type: 'bearer' })
      .send({ ...reading, measuredAt: new Date(Date.now() - 10000).toISOString() })
      .expect(201);
    list = await request(app.getHttpServer())
      .get(`/api/v1/alerts?depositId=${depositId}&status=OPEN`)
      .auth(u.staff, { type: 'bearer' })
      .expect(200);
    expect(list.body.items.some((a: { kind: string }) => a.kind === 'ENVIRONMENT')).toBe(false);
  });

  it('detecta inspecciones vencidas con la evaluación manual', async () => {
    await app
      .get(DataSource)
      .query('UPDATE records SET "nextInspectionAt"=NOW()-INTERVAL \'1 day\' WHERE id=$1', [
        recordId,
      ]);
    await request(app.getHttpServer())
      .post('/api/v1/alerts/evaluate')
      .auth(u.staff, { type: 'bearer' })
      .expect(201);
    const alerts = await request(app.getHttpServer())
      .get(`/api/v1/alerts?recordId=${recordId}&status=OPEN&sort=priority&order=DESC`)
      .auth(u.staff, { type: 'bearer' })
      .expect(200);
    expect(alerts.body.items[0].kind).toBe('OVERDUE');
  });
});
