import { BusinessError, Task } from '../model';

/** HU14: las tareas avanzan paso a paso (PENDING → IN_PROGRESS → DONE), sin saltos ni retrocesos, y al completarse exigen evidencia. */
export function assertTaskTransition(
  from: Task['status'],
  to: Task['status'],
  resolution: string,
): void {
  const allowed = { PENDING: ['IN_PROGRESS'], IN_PROGRESS: ['DONE'], DONE: [] };
  if (!(allowed[from] as string[]).includes(to))
    throw new BusinessError(409, 'Transición de tarea no permitida');
  if (to === 'DONE' && resolution.trim().length < 10)
    throw new BusinessError(400, 'Describe la intervención realizada (mínimo 10 caracteres)');
}
