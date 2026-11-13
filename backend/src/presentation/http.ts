import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessError, Role } from '../domain/model';

/** Usuario autenticado que el guard de acceso deja en la petición. */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: Date;
  sid: string;
};
export type AuthRequest = Request & { user: AuthUser };

/** Marca una ruta como pública (no exige sesión). */
export const Public = () => SetMetadata('public', true);
/** Restringe una ruta o controlador a ciertos roles. */
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

/** Convierte cualquier error en la respuesta uniforme {statusCode, message, path, timestamp}. */
@Catch()
export class ErrorFilter implements ExceptionFilter {
  private logger = new Logger('HTTP');
  catch(error: unknown, host: ArgumentsHost) {
    let status = 500;
    let message: string | string[] = 'Error interno del servidor';
    if (error instanceof BusinessError) {
      status = error.status;
      message = error.message;
    } else if (error instanceof HttpException) {
      status = error.getStatus();
      const response = error.getResponse();
      message =
        typeof response === 'string'
          ? response
          : (response as { message: string | string[] }).message;
    } else if (typeof error === 'object' && error && 'driverError' in error) {
      const code = (error.driverError as { code?: string }).code;
      if (code === '23505') {
        status = 409;
        message = 'Ya existe un registro con esos datos';
      } else if (code === '23503') {
        status = 400;
        message = 'Referencia inexistente o registro utilizado';
      } else if (code === '23514') {
        status = 400;
        message = 'Los datos incumplen una regla de integridad';
      }
    }
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    if (status === 500)
      this.logger.error({
        event: 'request_failed',
        path: req.path,
        errorType: error instanceof Error ? error.name : 'Unknown',
      });
    ctx
      .getResponse<Response>()
      .status(status)
      .json({ statusCode: status, message, path: req.path, timestamp: new Date().toISOString() });
  }
}
