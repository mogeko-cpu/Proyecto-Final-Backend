import { Health, ListItems, openAlert, resolveAlerts } from '../src/application/common';
import { BusinessError, requireFound } from '../src/domain/model';
import { MemoryRepository, TestRuntime } from './memory';

describe('Base: utilidades compartidas', () => {
  let repo: MemoryRepository;
  let rt: TestRuntime;
  beforeEach(() => {
    repo = new MemoryRepository();
    rt = new TestRuntime();
  });
  const alert = {
    kind: 'CRITICAL' as const,
    priority: 1,
    recordId: 'r1',
    depositId: 'd1',
    key: 'CRITICAL:r1',
    message: 'Prueba',
  };

  it('requireFound devuelve el valor o lanza 404', () => {
    expect(requireFound('sí', 'Valor')).toBe('sí');
    expect(() => requireFound(null, 'Valor')).toThrow(BusinessError);
    expect(() => requireFound(null, 'Valor')).toThrow('Valor no encontrado');
  });

  it('openAlert no duplica una alerta abierta con la misma clave', async () => {
    const first = await openAlert(repo, rt, alert);
    rt.advance(1000);
    const second = await openAlert(repo, rt, { ...alert, message: 'Actualizada' });
    expect(second.id).toBe(first.id);
    expect(second.createdAt).toEqual(first.createdAt);
    expect(await repo.find('alerts', { status: 'OPEN' })).toHaveLength(1);
  });

  it('resolveAlerts cierra las abiertas y conserva el historial', async () => {
    await openAlert(repo, rt, alert);
    await resolveAlerts(repo, rt, 'CRITICAL:r1');
    expect(await repo.find('alerts', { status: 'OPEN' })).toHaveLength(0);
    const [resolved] = await repo.find('alerts', { status: 'RESOLVED' });
    expect(resolved.resolvedAt).toEqual(rt.now());
    await openAlert(repo, rt, alert);
    expect(await repo.find('alerts', {})).toHaveLength(2);
  });

  it('ListItems pagina y Health informa el estado de la base de datos', async () => {
    for (let i = 0; i < 3; i++) await openAlert(repo, rt, { ...alert, key: `K${i}` });
    const page = await new ListItems(repo).execute('alerts', {
      page: 1,
      limit: 2,
      sort: 'createdAt',
      order: 'DESC',
    });
    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(3);
    expect(await new Health(repo).execute()).toEqual({ status: 'ok', database: 'up' });
    repo.health = async () => false;
    await expect(new Health(repo).execute()).rejects.toThrow('no disponible');
  });
});
