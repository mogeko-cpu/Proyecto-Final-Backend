import { BusinessError, requireFound, Task } from '../domain/model';
import { Repository, Runtime } from '../domain/ports';
import { assertTaskTransition } from '../domain/rules/tasks';

export type NewTask = Pick<Task, 'alertId' | 'assigneeId' | 'title'> & { dueAt: Date };

export class AssignTask {
  constructor(
    private repo: Repository,
    private rt: Runtime,
  ) {}
  execute(input: NewTask) {
    return this.repo.transaction(async (repo) => {
      const alert = requireFound(await repo.get('alerts', input.alertId), 'Alerta');
      if (alert.status !== 'OPEN') throw new BusinessError(409, 'La alerta ya está resuelta');
      const user = requireFound(await repo.get('users', input.assigneeId), 'Responsable');
      if (!user.active || user.role === 'PUBLIC')
        throw new BusinessError(400, 'El responsable debe ser personal activo del CLENA');
      if (input.dueAt <= this.rt.now())
        throw new BusinessError(400, 'La fecha de entrega debe estar en el futuro');
      if ((await repo.find('tasks', { alertId: input.alertId })).some((t) => t.status !== 'DONE'))
        throw new BusinessError(409, 'Esta alerta ya tiene una tarea activa');
      return repo.save('tasks', {
        ...input,
        id: this.rt.id(),
        createdAt: this.rt.now(),
        status: 'PENDING',
        resolution: '',
        completedAt: null,
      });
    });
  }
}

export class UpdateTask {
  constructor(
    private repo: Repository,
    private rt: Runtime,
  ) {}
  execute(
    id: string,
    input: { status: Task['status']; resolution: string },
    actor: { id: string; role: string },
  ) {
    return this.repo.transaction(async (repo) => {
      const task = requireFound(await repo.get('tasks', id), 'Tarea');
      if (actor.role !== 'ADMIN' && task.assigneeId !== actor.id)
        throw new BusinessError(
          403,
          'Solo el responsable o un administrador puede actualizar esta tarea',
        );
      assertTaskTransition(task.status, input.status, input.resolution);
      // Finalizar una tarea no implica que el riesgo haya desaparecido: se requiere una nueva medición/inspección.
      return repo.save('tasks', {
        ...task,
        ...input,
        completedAt: input.status === 'DONE' ? this.rt.now() : null,
      });
    });
  }
}
