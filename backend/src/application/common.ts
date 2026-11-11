import { Alert, BusinessError, ListQuery, Table } from '../domain/model';
import { Repository, Runtime } from '../domain/ports';

/** Recursos que se pueden listar de forma genérica (usuarios y sesiones tienen su propio caso de uso). */
export type ListableTable = Exclude<Table, 'users' | 'sessions'>;

export class ListItems {
  constructor(private repo: Repository) {}
  execute(table: ListableTable, query: ListQuery) {
    return this.repo.list(table, query);
  }
}

export class Health {
  constructor(private repo: Repository) {}
  async execute() {
    if (!(await this.repo.health())) throw new BusinessError(503, 'Base de datos no disponible');
    return { status: 'ok', database: 'up' };
  }
}

export type NewAlert = Omit<Alert, 'id' | 'createdAt' | 'status' | 'resolvedAt'>;

/** Abre una alerta o actualiza la que ya está abierta con la misma clave (no duplica). */
export async function openAlert(repo: Repository, rt: Runtime, input: NewAlert) {
  const existing = (await repo.find('alerts', { key: input.key, status: 'OPEN' }))[0];
  return repo.save('alerts', {
    ...input,
    id: existing?.id ?? rt.id(),
    createdAt: existing?.createdAt ?? rt.now(),
    status: 'OPEN',
    resolvedAt: null,
  });
}

/** Resuelve todas las alertas abiertas con esa clave, conservando su historial. */
export async function resolveAlerts(repo: Repository, rt: Runtime, key: string) {
  for (const alert of await repo.find('alerts', { key, status: 'OPEN' }))
    await repo.save('alerts', { ...alert, status: 'RESOLVED', resolvedAt: rt.now() });
}
