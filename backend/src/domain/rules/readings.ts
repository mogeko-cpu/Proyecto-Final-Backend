import { Deposit, Reading } from '../model';

/** HU10: una lectura está fuera de rango si se sale de los umbrales del depósito. Los límites exactos están dentro. */
export function outsideRange(r: Pick<Reading, 'temperature' | 'humidity'>, d: Deposit): boolean {
  return (
    r.temperature < d.tempMin ||
    r.temperature > d.tempMax ||
    r.humidity < d.humidityMin ||
    r.humidity > d.humidityMax
  );
}
