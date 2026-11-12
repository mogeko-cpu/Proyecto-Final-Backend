import { CreateDeposit, CreateRecord, UpdateRecord } from '../src/application/inventory';
import { EvaluateOverdue, IngestReading, RegisterInspection } from '../src/application/monitoring';
import { ArchiveRecord } from '../src/application/inventory';
import { Deposit, RecordFile } from '../src/domain/model';
import { outsideRange } from '../src/domain/rules/readings';
import { MemoryRepository, TestRuntime } from './memory';

describe('Monitoreo: reglas de dominio', () => {
  const d = { tempMin: 18, tempMax: 24, humidityMin: 40, humidityMax: 60 } as Deposit;
  it('los límites exactos están dentro del rango y cada extremo se detecta (HU10)', () => {
    expect(outsideRange({ temperature: 18, humidity: 40 }, d)).toBe(false);
    expect(outsideRange({ temperature: 24, humidity: 60 }, d)).toBe(false);
    for (const r of [
      { temperature: 17, humidity: 50 },
      { temperature: 25, humidity: 50 },
      { temperature: 20, humidity: 39 },
      { temperature: 20, humidity: 61 },
    ])
      expect(outsideRange(r, d)).toBe(true);
  });
});

describe('Monitoreo: casos de uso', () => {
  let repo: MemoryRepository;
  let rt: TestRuntime;
  let deposit: Deposit;
  let record: RecordFile;
  const staffId = 'staff-1';
  const input = {
    code: 'EXP-001',
    title: 'Archivo de prueba',
    shelf: 'E1',
    box: 'C1',
    description: 'Ficticio',
    inspectionDays: 30,
  };
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
    deposit = await new CreateDeposit(repo, rt).execute({
      name: 'A',
      tempMin: 18,
      tempMax: 24,
      humidityMin: 40,
      humidityMax: 60,
    });
    record = await new CreateRecord(repo, rt).execute({ ...input, depositId: deposit.id });
  });

  it('registra la inspección, actualiza estado y próxima revisión (HU06)', async () => {
    const i = await new RegisterInspection(repo, rt).execute(record.id, staffId, {
      ...inspection,
      condition: 'OPTIMO',
    });
    expect(i.inspectorId).toBe(staffId);
    const updated = await repo.get('records', record.id);
    expect(updated?.condition).toBe('OPTIMO');
    expect(updated!.nextInspectionAt.getTime() - rt.now().getTime()).toBe(30 * 86400000);
    await expect(
      new RegisterInspection(repo, rt).execute('no', staffId, inspection),
    ).rejects.toThrow('Expediente');
  });

  it('al cambiar la periodicidad recalcula desde la última inspección', async () => {
    await new RegisterInspection(repo, rt).execute(record.id, staffId, inspection);
    const changed = await new UpdateRecord(repo, rt).execute(record.id, {
      ...input,
      depositId: deposit.id,
      inspectionDays: 7,
    });
    expect(changed.nextInspectionAt.getTime() - rt.now().getTime()).toBe(7 * 86400000);
  });

  it('abre alerta crítica sin duplicar y conserva el historial (HU07, HU08)', async () => {
    const inspect = new RegisterInspection(repo, rt);
    await inspect.execute(record.id, staffId, inspection);
    await inspect.execute(record.id, staffId, { ...inspection, notes: 'Nueva observación' });
    expect(await repo.find('alerts', { status: 'OPEN' })).toHaveLength(1);
    expect(await repo.find('inspections', {})).toHaveLength(2);
    await inspect.execute(record.id, staffId, { ...inspection, condition: 'OPTIMO' });
    expect(await repo.find('alerts', { status: 'OPEN' })).toHaveLength(0);
    await inspect.execute(record.id, staffId, inspection);
    expect(await repo.find('alerts', {})).toHaveLength(2);
  });

  it('evalúa vencimientos de forma idempotente y los resuelve al inspeccionar (HU09)', async () => {
    const evaluate = new EvaluateOverdue(repo, rt);
    expect((await evaluate.execute()).overdue).toBe(0);
    rt.advance(1);
    expect((await evaluate.execute()).overdue).toBe(1);
    await evaluate.execute();
    expect(await repo.find('alerts', { status: 'OPEN' })).toHaveLength(1);
    await new RegisterInspection(repo, rt).execute(record.id, staffId, {
      ...inspection,
      condition: 'REGULAR',
    });
    expect(await repo.find('alerts', { status: 'OPEN' })).toHaveLength(0);
  });

  it('un expediente archivado no acepta inspecciones ni cuenta como vencido', async () => {
    await new ArchiveRecord(repo, rt).execute(record.id);
    await expect(
      new RegisterInspection(repo, rt).execute(record.id, staffId, inspection),
    ).rejects.toThrow('archivado');
    rt.advance(50 * 86400000);
    expect((await new EvaluateOverdue(repo, rt).execute()).overdue).toBe(0);
  });

  it('una lectura normal resuelve el riesgo y una atrasada no cambia el vigente (HU10)', async () => {
    const ingest = new IngestReading(repo, rt);
    const base = {
      depositId: deposit.id,
      sensorId: 'SIM',
      temperature: 28,
      humidity: 70,
      measuredAt: rt.now(),
    };
    await ingest.execute(base);
    rt.advance(1000);
    await ingest.execute({ ...base, measuredAt: rt.now() });
    expect(await repo.find('alerts', { status: 'OPEN' })).toHaveLength(1);
    await ingest.execute({
      ...base,
      temperature: 22,
      humidity: 50,
      measuredAt: new Date(rt.now().getTime() - 500),
    });
    expect(await repo.find('alerts', { status: 'OPEN' })).toHaveLength(1);
    rt.advance(1000);
    await ingest.execute({ ...base, temperature: 22, humidity: 50, measuredAt: rt.now() });
    expect(await repo.find('alerts', { status: 'OPEN' })).toHaveLength(0);
    await ingest.execute({ ...base, measuredAt: new Date(rt.now().getTime() - 500) });
    expect(await repo.find('alerts', { status: 'OPEN' })).toHaveLength(0);
    await expect(
      ingest.execute({ ...base, measuredAt: new Date(rt.now().getTime() + 61000) }),
    ).rejects.toThrow('24 horas');
    await expect(
      ingest.execute({ ...base, measuredAt: new Date(rt.now().getTime() - 86400001) }),
    ).rejects.toThrow('24 horas');
    await expect(ingest.execute({ ...base, depositId: 'missing' })).rejects.toThrow('Depósito');
  });
});
