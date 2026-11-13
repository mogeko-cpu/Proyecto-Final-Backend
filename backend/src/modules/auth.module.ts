import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  Authenticate,
  DeleteAccount,
  ListUsers,
  Login,
  Logout,
  RefreshSession,
  RegisterUser,
} from '../application/auth';
import { AccessGuard } from '../presentation/access.guard';
import { AuthController } from '../presentation/controllers/auth.controller';
import { UsersController } from '../presentation/controllers/users.controller';
import { REPOSITORY, RUNTIME, SECURITY } from './tokens';
import { useCase } from './use-case';

@Module({
  controllers: [AuthController, UsersController],
  providers: [
    useCase(RegisterUser, REPOSITORY, RUNTIME, SECURITY),
    useCase(Login, REPOSITORY, RUNTIME, SECURITY),
    useCase(RefreshSession, REPOSITORY, RUNTIME, SECURITY),
    useCase(Authenticate, REPOSITORY, RUNTIME, SECURITY),
    useCase(Logout, REPOSITORY),
    useCase(ListUsers, REPOSITORY),
    useCase(DeleteAccount, REPOSITORY, SECURITY),
    // Desde que este módulo existe, toda ruta exige sesión salvo las marcadas con @Public().
    { provide: APP_GUARD, useClass: AccessGuard },
  ],
  exports: [RegisterUser],
})
export class AuthModule {}
