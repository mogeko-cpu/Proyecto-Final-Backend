import { RecordFile } from '../model';

/** Fecha de la próxima inspección: hoy + periodicidad del expediente (HU04). */
export function nextInspection(now: Date, days: number): Date {
  return new Date(now.getTime() + days * 86400000);
}

/** Un expediente activo está vencido si su próxima inspección ya pasó (HU09). */
export function isOverdue(record: RecordFile, now: Date): boolean {
  return !record.archived && record.nextInspectionAt < now;
}
