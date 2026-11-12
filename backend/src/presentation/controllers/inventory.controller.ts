import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListItems } from '../../application/common';
import {
  ArchiveRecord,
  CreateDeposit,
  CreateRecord,
  GetRecord,
  RegisterInspection,
  UpdateDeposit,
  UpdateRecord,
} from '../../application/inventory';
import {
  DepositDto,
  InspectionDto,
  RecordDto,
} from '../dto/inventory.dto';
import { ListDto } from '../dto/list.dto';
import { Roles } from '../http';

@ApiTags('Inventario')
@ApiBearerAuth()
@Roles('ADMIN', 'STAFF')
@Controller('api/v1')
export class InventoryController {
  constructor(
    private list: ListItems,
    private createDeposit: CreateDeposit,
    private updateDeposit: UpdateDeposit,
    private createRecord: CreateRecord,
    private updateRecord: UpdateRecord,
    private archiveRecord: ArchiveRecord,
    private getRecord: GetRecord,
    private registerInspectionUseCase: RegisterInspection,
  ) {}

  @Get('deposits')
  @ApiOperation({ summary: 'Listar depósitos y umbrales (paginado)' })
  deposits(@Query() q: ListDto) {
    return this.list.execute('deposits', q);
  }

  @Roles('ADMIN')
  @Post('deposits')
  @ApiOperation({ summary: 'Crear depósito y umbrales; solo administrador' })
  newDeposit(@Body() dto: DepositDto) {
    return this.createDeposit.execute(dto);
  }

  @Roles('ADMIN')
  @Put('deposits/:id')
  @ApiOperation({ summary: 'Actualizar depósito; los umbrales aplican a la próxima lectura' })
  editDeposit(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DepositDto) {
    return this.updateDeposit.execute(id, dto);
  }

  @Get('records')
  @ApiOperation({ summary: 'Inventario; buscar código/título, filtrar estado/depósito/archivado' })
  records(@Query() q: ListDto) {
    return this.list.execute('records', q);
  }

  @Get('records/:id')
  @ApiOperation({ summary: 'Detalle de expediente' })
  record(@Param('id', ParseUUIDPipe) id: string) {
    return this.getRecord.execute(id);
  }

  @Post('records')
  @ApiOperation({ summary: 'Crear expediente; primera inspección pendiente de inmediato' })
  newRecord(@Body() dto: RecordDto) {
    return this.createRecord.execute(dto);
  }

  @Put('records/:id')
  @ApiOperation({ summary: 'Editar ubicación, metadatos y periodicidad' })
  editRecord(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RecordDto) {
    return this.updateRecord.execute(id, dto);
  }

  @Post('inspections')
  @ApiOperation({ summary: 'Registrar inspección de un expediente' })
  registerInspection(@Body() dto: InspectionDto) {
    return this.registerInspectionUseCase.execute(dto);
  }

  @Roles('ADMIN')
  @Delete('records/:id')
  @ApiOperation({ summary: 'Archivar expediente sin borrar historial' })
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.archiveRecord.execute(id);
  }
}