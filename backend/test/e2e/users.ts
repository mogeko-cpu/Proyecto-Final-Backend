import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { RegisterUser } from '../../src/application/auth';

export const password = 'Test-password-2026!';

/** Crea un administrador, un miembro del personal y un usuario público e inicia sesión con cada uno. */
export async function createUsers(app: INestApplication) {
  const suffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const register = app.get(RegisterUser);
  const tokens = {} as Record<'ADMIN' | 'STAFF' | 'PUBLIC', string>;
  const ids = {} as Record<'ADMIN' | 'STAFF' | 'PUBLIC', string>;
  for (const role of ['ADMIN', 'STAFF', 'PUBLIC'] as const) {
    const email = `${role.toLowerCase()}-${suffix}@example.com`;
    const user = await register.execute(
      { name: `Demo ${role}`, email, password, consent: true },
      role,
    );
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);
    tokens[role] = login.body.accessToken;
    ids[role] = user.id;
  }
  return {
    admin: tokens.ADMIN,
    staff: tokens.STAFF,
    visitor: tokens.PUBLIC,
    staffId: ids.STAFF,
    suffix,
  };
}
