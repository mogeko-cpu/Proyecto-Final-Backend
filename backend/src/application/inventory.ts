import {
  BusinessError,
  Deposit,
  Inspection,
  RecordFile,
  requireFound,
} from '../domain/model';
import { Repository, Runtime } from '../domain/ports';
import { checkRange } from '../domain/rules/deposits';
import { isOverdue, nextInspection } from '../domain/rules/records';
import { resolveAlerts } from './common';

export type NewDeposit = Omit<Deposit, 'id' | 'createdAt'>;

export type NewRecord = Pick<
  RecordFile,
  'code' | 'title' | 'depositId' | 'shelf' | 'box' | 'description' | 'inspectionDays'
>;

export type NewInspection = Pick<
  Inspection,
  'recordId' | 'inspectorId' | 'condition' | 'notes' | 'pests' | 'wear' | 'moisture'
>;

export class CreateDeposit {
  constructor(
    private repo: Repository,
    private rt: Runtime,
  ) {}

  execute(input: NewDeposit) {
    checkRange(input);

    return this.repo.save('deposits', {
      ...input,
      id: this.rt.id(),
      createdAt: this.rt.now(),
    });
  }
}

export class UpdateDeposit {
  constructor(private repo: Repository) {}

  async execute(id: string, input: NewDeposit) {
    checkRange(input);

    return this.repo.save('deposits', {
      ...requireFound(await this.repo.get('deposits', id), 'Depósito'),
      ...input,
    });
  }
}

export class CreateRecord {
  constructor(
    private repo: Repository,
    private rt: Runtime,
  ) {}

  async execute(input: NewRecord) {
    requireFound(await this.repo.get('deposits', input.depositId), 'Depósito');

    return this.repo.save('records', {
      ...input,
      id: this.rt.id(),
      createdAt: this.rt.now(),
      condition: 'REGULAR',
      archived: false,
      // Queda pendiente de primera inspección desde el momento de su registro.
      nextInspectionAt: this.rt.now(),
    });
  }
}

export class UpdateRecord {
  constructor(
    private repo: Repository,
    private rt: Runtime,
  ) {}

  async execute(id: string, input: NewRecord) {
    return this.repo.transaction(async (repo) => {
      const record = requireFound(await repo.get('records', id), 'Expediente');

      if (record.archived)
        throw new BusinessError(409, 'Expediente archivado');

      requireFound(await repo.get('deposits', input.depositId), 'Depósito');

      const last = await repo.list('inspections', {
        page: 1,
        limit: 1,
        sort: 'createdAt',
        order: 'DESC',
        recordId: id,
      });

      const updated = await repo.save('records', {
        ...record,
        ...input,
        // Si cambia la periodicidad, la próxima inspección se recalcula desde la última realizada.
        nextInspectionAt: last.items[0]
          ? nextInspection(last.items[0].createdAt, input.inspectionDays)
          : record.nextInspectionAt,
      });

      for (const a of await repo.find('alerts', {
        recordId: id,
        status: 'OPEN',
      })) {
        await repo.save('alerts', {
          ...a,
          depositId: input.depositId,
        });
      }

      if (!isOverdue(updated, this.rt.now()))
        await resolveAlerts(repo, this.rt, `OVERDUE:${id}`);

      return updated;
    });
  }
}

export class ArchiveRecord {
  constructor(
    private repo: Repository,
    private rt: Runtime,
  ) {}

  execute(id: string) {
    return this.repo.transaction(async (repo) => {
      const record = requireFound(
        await repo.get('records', id),
        'Expediente',
      );

      await resolveAlerts(repo, this.rt, `CRITICAL:${id}`);
      await resolveAlerts(repo, this.rt, `OVERDUE:${id}`);

      return repo.save('records', {
        ...record,
        archived: true,
      });
    });
  }
}

export class GetRecord {
  constructor(private repo: Repository) {}

  async execute(id: string) {
    return requireFound(
      await this.repo.get('records', id),
      'Expediente',
    );
  }
}

export class RegisterInspection {
  constructor(
    private repo: Repository,
    private rt: Runtime,
  ) {}

  async execute(input: NewInspection) {
    return this.repo.transaction(async (repo) => {
      const record = requireFound(
        await repo.get('records', input.recordId),
        'Expediente',
      );

      requireFound(
        await repo.get('users', input.inspectorId),
        'Inspector',
      );

      if (record.archived)
        throw new BusinessError(409, 'Expediente archivado');

      const inspection = await repo.save('inspections', {
        ...input,
        id: this.rt.id(),
        createdAt: this.rt.now(),
      });

      const nextInspectionAt = nextInspection(
        inspection.createdAt,
        record.inspectionDays,
      );

      await repo.save('records', {
        ...record,
        condition: inspection.condition,
        nextInspectionAt,
      });

      return inspection;
    });
  }
}