import { Module } from '@nestjs/common';
import { GetDashboard } from '../application/dashboard';
import { AssignTask, UpdateTask } from '../application/interventions';
import { InterventionsController } from '../presentation/controllers/interventions.controller';
import { REPOSITORY, RUNTIME } from './tokens';
import { useCase } from './use-case';

@Module({
  controllers: [InterventionsController],
  providers: [
    useCase(AssignTask, REPOSITORY, RUNTIME),
    useCase(UpdateTask, REPOSITORY, RUNTIME),
    useCase(GetDashboard, REPOSITORY, RUNTIME),
  ],
})
export class InterventionsModule {}
