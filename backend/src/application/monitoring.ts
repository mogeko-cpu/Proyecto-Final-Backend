import { BusinessError, Inspection, Reading, requireFound } from '../domain/model';
import { Repository, Runtime } from '../domain/ports';
import { outsideRange } from '../domain/rules/readings';
import { isOverdue, nextInspection } from '../domain/rules/records';
import { openAlert, resolveAlerts } from './common';

export type NewInspection = Pick<Inspection, 'condition' | 'notes' | 'pests' | 'wear' | 'moisture'>;
export type NewReading = Pick<Reading, 'depositId' | 'sensorId' | 'temperature' | 'humidity'> & {
  measuredAt: Date;
};

export class RegisterInspection {
  constructor(
    private repo: Repository,
    private rt: Runtime,
  ) {}
  execute(recordId: string, inspectorId: string, input: NewInspection) {
    return this.repo.transaction(async (repo) => {
      const record = requireFound(await repo.get('records', recordId), 'Expediente');
      if (record.archived)
        throw new BusinessError(409, 'No se puede inspeccionar un expediente archivado');
      const inspection = await repo.save('inspections', {
        ...input,
        id: this.rt.id(),
        createdAt: this.rt.now(),
        recordId,
        inspectorId,
      });
      await repo.save('records', {
        ...record,
        condition: input.condition,
        nextInspectionAt: nextInspection(this.rt.now(), record.inspectionDays),
      });
      await resolveAlerts(repo, this.rt, `OVERDUE:${recordId}`);
      if (input.condition === 'CRITICO')
        await openAlert(repo, this.rt, {
          kind: 'CRITICAL',
          priority: 1,
          recordId,
          depositId: record.depositId,
          key: `CRITICAL:${recordId}`,
          message: `${record.code}: inspección en estado crítico. ${input.notes}`,
        });
      else await resolveAlerts(repo, this.rt, `CRITICAL:${recordId}`);
      return inspection;
    });
  }
}

export class IngestReading {
  constructor(
    private repo: Repository,
    private rt: Runtime,
  ) {}
  async execute(input: NewReading) {
    if (
      input.measuredAt.getTime() > this.rt.now().getTime() + 60000 ||
      input.measuredAt.getTime() < this.rt.now().getTime() - 86400000
    )
      throw new BusinessError(
        400,
        'La lectura debe corresponder a las últimas 24 horas y no estar en el futuro',
      );
    return this.repo.transaction(async (repo) => {
      const deposit = requireFound(await repo.get('deposits', input.depositId), 'Depósito');
      const previous = (
        await repo.list('readings', {
          page: 1,
          limit: 1,
          sort: 'measuredAt',
          order: 'DESC',
          depositId: input.depositId,
        })
      ).items[0];
      const reading = await repo.save('readings', {
        ...input,
        id: this.rt.id(),
        createdAt: this.rt.now(),
      });
      // Las lecturas atrasadas quedan en el historial sin sobrescribir el estado vigente.
      if (!previous || input.measuredAt >= previous.measuredAt) {
        if (outsideRange(reading, deposit))
          await openAlert(repo, this.rt, {
            kind: 'ENVIRONMENT',
            priority: 2,
            recordId: null,
            depositId: deposit.id,
            key: `ENVIRONMENT:${deposit.id}`,
            message: `${deposit.name}: ${reading.temperature} °C / ${reading.humidity} % HR fuera del rango configurado`,
          });
        else await resolveAlerts(repo, this.rt, `ENVIRONMENT:${deposit.id}`);
      }
      return reading;
    });
  }
}

export class EvaluateOverdue {
  constructor(
    private repo: Repository,
    private rt: Runtime,
  ) {}
  execute() {
    return this.repo.transaction(async (repo) => {
      let count = 0;
      for (const record of await repo.find('records', { archived: false }))
        if (isOverdue(record, this.rt.now())) {
          await openAlert(repo, this.rt, {
            kind: 'OVERDUE',
            priority: 3,
            recordId: record.id,
            depositId: record.depositId,
            key: `OVERDUE:${record.id}`,
            message: `${record.code}: inspección vencida desde ${record.nextInspectionAt.toISOString().slice(0, 10)}`,
          });
          count++;
        }
      return { evaluatedAt: this.rt.now(), overdue: count };
    });
  }
}
