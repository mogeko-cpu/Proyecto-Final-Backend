import { FactoryProvider } from '@nestjs/common';

type UseCaseClass<T> = new (...args: never[]) => T;

/**
 * Registra un caso de uso en Nest sin que la capa de aplicación dependa del framework:
 * Nest crea la clase pasando los puertos indicados (repositorio, reloj, seguridad).
 */
export function useCase<T>(type: UseCaseClass<T>, ...inject: symbol[]): FactoryProvider<T> {
  return {
    provide: type,
    useFactory: (...deps: unknown[]) => new type(...(deps as never[])),
    inject,
  };
}
