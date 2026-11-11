import { RegisterUser } from '../src/application/auth';
import { GetDashboard } from '../src/application/dashboard';
import { AssignTask, UpdateTask } from '../src/application/interventions';
import { CreateDeposit, CreateRecord } from '../src/application/inventory';
import { EvaluateOverdue, RegisterInspection } from '../src/application/monitoring';
import { RecordFile } from '../src/domain/model';
import { assertTaskTransition } from '../src/domain/rules/tasks';
import { FakeSecurity, MemoryRepository, TestRuntime } from './memory';

describe('Intervenciones: reglas de dominio', () => {
  it('solo permite avanzar tareas y exige resultado al completar (HU14)', () => {
    expect(() => assertTaskTransition('PENDING', 'IN_PROGRESS', '')).not.toThrow();
    expect(() => assertTaskTransition('PENDING', 'DONE', 'Intervención terminada')).not.toThrow();
    expect(() =>
      assertTaskTransition('IN_PROGRESS', 'DONE', 'Intervención terminada'),
    ).not.toThrow();
    expect(() => assertTaskTransition('IN_PROGRESS', 'PENDING', '')).toThrow('Transición');
    expect(() => assertTaskTransition('DONE', 'IN_PROGRESS', '')).toThrow('Transición');
    expect(() => assertTaskTransition('PENDING', 'DONE', 'breve')).toThrow('mínimo');
  });
});

describe('Intervenciones y dashboard: casos de uso', () => {
  let repo: MemoryRepository;
  let rt: TestRuntime;
  let record: RecordFile;
  let staffId: string;
  const inspection = {
    condition: 'CRITICO' as const,
    notes: 'Humedad y deterioro visibles',
    pests: false,
    wear: true,
    moisture: true,
  };
  beforeEach(async () => {
    repo = new MemoryRepository();
    rt = new TestRuntime();
    const deposit = await new CreateDeposit(repo, rt).execute({
      name: 'A',
      tempMin: 18,
      tempMax: 24,
      humidityMin: 40,
      humidityMax: 60,
    });
    record = await new CreateRecord(repo, rt).execute({
      code: 'EXP-001',
      title: 'Archivo de prueba',
      depositId: deposit.id,
      shelf: 'E1',
      box: 'C1',
      description: 'Ficticio',
      inspectionDays: 30,
    });
    staffId = (
      await new RegisterUser(repo, rt, new FakeSecurity()).execute(
        { name: 'Staff', email: 'staff@example.com', password: 'pass', consent: true },
        'STAFF',
      )
    ).id;
  });

  it('asigna, valida responsable y fecha, impide duplicados y controla transiciones (HU13, HU14)', async () => {
    await new RegisterInspection(repo, rt).execute(record.id, staffId, inspection);
    const alert = (await repo.find('alerts', {}))[0];
    const assign = new AssignTask(repo, rt);
    const input = {
      alertId: alert.id,
      assigneeId: staffId,
      title: 'Inspeccionar y documentar',
      dueAt: new Date(rt.now().getTime() + 86400000),
    };
    await expect(assign.execute({ ...input, dueAt: rt.now() })).rejects.toThrow('futuro');
    const publicId = (
      await new RegisterUser(repo, rt, new FakeSecurity()).execute({
        name: 'Público',
        email: 'public@example.com',
        password: 'x',
        consent: true,
      })
    ).id;
    await expect(assign.execute({ ...input, assigneeId: publicId })).rejects.toThrow(
      'personal activo',
    );
    await repo.save('users', { ...(await repo.get('users', publicId))!, active: false });
    await expect(assign.execute({ ...input, assigneeId: publicId })).rejects.toThrow(
      'personal activo',
    );
    const task = await assign.execute(input);
    await expect(assign.execute(input)).rejects.toThrow('tarea activa');
    const update = new UpdateTask(repo, rt);
    await expect(
      update.execute(
        task.id,
        { status: 'IN_PROGRESS', resolution: '' },
        { id: 'otro', role: 'STAFF' },
      ),
    ).rejects.toThrow('responsable');
    await update.execute(
      task.id,
      { status: 'IN_PROGRESS', resolution: '' },
      { id: staffId, role: 'STAFF' },
    );
    await update.execute(
      task.id,
      { status: 'DONE', resolution: 'Se realizó revisión y estabilización' },
      { id: 'admin', role: 'ADMIN' },
    );
    // Completar la tarea no cierra la alerta: hay que comprobarlo con una nueva inspección.
    expect((await repo.get('alerts', alert.id))?.status).toBe('OPEN');
    expect((await repo.get('tasks', task.id))?.completedAt).toEqual(rt.now());
    await new RegisterInspection(repo, rt).execute(record.id, staffId, {
      ...inspection,
      condition: 'OPTIMO',
    });
    await expect(assign.execute(input)).rejects.toThrow('resuelta');
  });

  it('el dashboard resume y prioriza las alertas abiertas (HU12)', async () => {
    await new RegisterInspection(repo, rt).execute(record.id, staffId, inspection);
    rt.advance(31 * 86400000);
    await new EvaluateOverdue(repo, rt).execute();
    const alert = (await repo.find('alerts', {}))[0];
    await new AssignTask(repo, rt).execute({
      alertId: alert.id,
      assigneeId: staffId,
      title: 'Revisar',
      dueAt: new Date(rt.now().getTime() + 1000),
    });
    const dash = await new GetDashboard(repo, rt).execute();
    expect(dash).toMatchObject({
      records: 1,
      critical: 1,
      openAlerts: 2,
      pendingTasks: 1,
      overdue: 1,
    });
    expect(dash.prioritizedAlerts.map((a) => a.priority)).toEqual([1, 3]);
  });
});
