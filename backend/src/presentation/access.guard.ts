import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Authenticate } from '../application/auth';
import { Role } from '../domain/model';
import { AuthRequest } from './http';

/** Guard global: exige token Bearer válido salvo en rutas @Public() y valida @Roles(). */
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authenticate: Authenticate,
  ) {}
  async canActivate(context: ExecutionContext) {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>('public', targets)) return true;
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Se requiere una sesión');
    req.user = await this.authenticate.execute(token);
    const roles = this.reflector.getAllAndOverride<Role[]>('roles', targets);
    if (roles && !roles.includes(req.user.role))
      throw new ForbiddenException('No tienes permiso para esta acción');
    return true;
  }
}
