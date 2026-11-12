import { BusinessError, Deposit } from '../model';

/** Regla HU03: el mínimo de cada rango ambiental debe ser menor que el máximo. */
export function checkRange(
  d: Pick<Deposit, 'tempMin' | 'tempMax' | 'humidityMin' | 'humidityMax'>,
): void {
  if (d.tempMin >= d.tempMax || d.humidityMin >= d.humidityMax)
    throw new BusinessError(400, 'El mínimo debe ser menor al máximo');
}
