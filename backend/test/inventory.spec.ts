import {
  ArchiveRecord,
  CreateDeposit,
  CreateRecord,
  GetRecord,
  UpdateDeposit,
  UpdateRecord,
} from '../src/application/inventory';
import { openAlert } from '../src/application/common';
import { BusinessError, Deposit, RecordFile } from '../src/domain/model';
import { checkRange } from '../src/domain/rules/deposits';
import { isOverdue, nextInspection } from '../src/domain/rules/records';
import { MemoryRepository, TestRuntime } from './memory';

describe('Inventario: reglas de dominio', () => {
  const d = { tempMin: 18, tempMax: 24, humidityMin: 40, humidityMax: 60 } as Deposit;
  it('el mínimo de cada rango debe ser menor que el máximo (HU03)', () => {
    expect(() => checkRange(d)).not.toThrow();
    expect(() => checkRange({ ...d, tempMin: 24 })).toThrow(BusinessError);
    expect(() => checkRange({ ...d, humidityMin: 60 })).toThrow(BusinessError);
  });
  it('calcula la próxima inspección y detecta vencimientos (HU04, HU09)', () => {
    expect(nextInspection(new Date('2026-01-31T12:00:00Z'), 1).toISOString()).toBe(
      '2026-02-01T12:00:00.000Z',
    );
    const r = { archived: false, nextInspectionAt: new Date(0) } as RecordFile;
    expect(isOverdue(r, new Date(1))).toBe(true);
    expect(isOverdue(r, new Date(0))).toBe(false);
    expect(isOverdue({ ...r, archived: true }, new Date(1))).toBe(false);
  });
});

describe('Inventario: casos de uso', () => {
  let repo: MemoryRepository;
  let rt: TestRuntime;
  let deposit: Deposit;
  let record: RecordFile;
  const input = {
    code: 'EXP-001',
    title: 'Archivo de prueba',
    shelf: 'E1',
    box: 'C1',
    description: 'Ficticio',
    inspectionDays: 30,
  };
  beforeEach(async () => {
    repo = new MemoryRepository();
    rt = new TestRuntime();
    deposit = await new CreateDeposit(repo, rt).execute({
      name: 'A',
      tempMin: 18,
      tempMax: 24,
      humidityMin: 40,
      humidityMax: 60,
    });
    record = await new CreateRecord(repo, rt).execute({ ...input, depositId: deposit.id });
  });

  it('crea depósitos y expedientes; un expediente nuevo queda pendiente de inspección', async () => {
    expect(record.nextInspectionAt).toEqual(rt.now());
    expect(record.condition).toBe('REGULAR');
    expect(record.archived).toBe(false);
    expect(() => new CreateDeposit(repo, rt).execute({ ...deposit, tempMin: 30 })).toThrow(
      'mínimo',
    );
    await expect(new CreateRecord(repo, rt).execute({ ...input, depositId: 'no' })).rejects.toThrow(
      'Depósito',
    );
  });

  it('edita depósitos y expedientes', async () => {
    await new UpdateDeposit(repo).execute(deposit.id, { ...deposit, tempMax: 25 });
    expect((await repo.get('deposits', deposit.id))?.tempMax).toBe(25);
    await expect(new UpdateDeposit(repo).execute('no', deposit)).rejects.toThrow('Depósito');
    const r = await new UpdateRecord(repo, rt).execute(record.id, {
      ...input,
      depositId: deposit.id,
      title: 'Nuevo título',
    });
    expect(r.title).toBe('Nuevo título');
    expect(r.nextInspectionAt).toEqual(record.nextInspectionAt);
    expect((await new GetRecord(repo).execute(record.id)).title).toBe('Nuevo título');
    await expect(new GetRecord(repo).execute('no')).rejects.toThrow('Expediente');
  });

  it('al editar mueve sus alertas abiertas al nuevo depósito', async () => {
    const other = await new CreateDeposit(repo, rt).execute({ ...deposit, name: 'B' });
    await openAlert(repo, rt, {
      kind: 'CRITICAL',
      priority: 1,
      recordId: record.id,
      depositId: deposit.id,
      key: `CRITICAL:${record.id}`,
      message: 'Crítico',
    });
    await new UpdateRecord(repo, rt).execute(record.id, { ...input, depositId: other.id });
    expect((await repo.find('alerts', { status: 'OPEN' }))[0].depositId).toBe(other.id);
  });

  it('archiva sin borrar historial, resuelve sus alertas y bloquea la edición (HU05)', async () => {
    await openAlert(repo, rt, {
      kind: 'OVERDUE',
      priority: 3,
      recordId: record.id,
      depositId: deposit.id,
      key: `OVERDUE:${record.id}`,
      message: 'Vencido',
    });
    const archived = await new ArchiveRecord(repo, rt).execute(record.id);
    expect(archived.archived).toBe(true);
    expect(await repo.find('alerts', { status: 'OPEN' })).toHaveLength(0);
    expect(await repo.find('alerts', {})).toHaveLength(1);
    await expect(
      new UpdateRecord(repo, rt).execute(record.id, { ...input, depositId: deposit.id }),
    ).rejects.toThrow('archivado');
  });
});
