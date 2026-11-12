import { Module } from '@nestjs/common';
import {
  ArchiveRecord,
  CreateDeposit,
  CreateRecord,
  GetRecord,
  UpdateDeposit,
  UpdateRecord,
} from '../application/inventory';
import { InventoryController } from '../presentation/controllers/inventory.controller';
import { REPOSITORY, RUNTIME } from './tokens';
import { useCase } from './use-case';

@Module({
  controllers: [InventoryController],
  providers: [
    useCase(CreateDeposit, REPOSITORY, RUNTIME),
    useCase(UpdateDeposit, REPOSITORY),
    useCase(CreateRecord, REPOSITORY, RUNTIME),
    useCase(UpdateRecord, REPOSITORY, RUNTIME),
    useCase(ArchiveRecord, REPOSITORY, RUNTIME),
    useCase(GetRecord, REPOSITORY),
  ],
})
export class InventoryModule {}
