import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListItems } from '../../application/common';
import { EvaluateOverdue, IngestReading, RegisterInspection } from '../../application/monitoring';
import { ListDto } from '../dto/list.dto';
import { InspectionDto, ReadingDto } from '../dto/monitoring.dto';
import { AuthRequest, Roles } from '../http';

@ApiTags('Monitoreo')
@ApiBearerAuth()
@Roles('ADMIN', 'STAFF')
@Controller('api/v1')
export class MonitoringController {
  constructor(
    private list: ListItems,
    private inspect: RegisterInspection,
    private ingest: IngestReading,
    private evaluate: EvaluateOverdue,
  ) {}
  @Get('records/:id/inspections')
  @ApiOperation({ summary: 'Historial paginado de inspecciones' })
  history(@Param('id', ParseUUIDPipe) id: string, @Query() q: ListDto) {
    return this.list.execute('inspections', { ...q, recordId: id });
  }
  @Post('records/:id/inspections')
  @ApiOperation({
    summary: 'Registrar inspección, actualizar vencimiento y evaluar estado crítico',
  })
  inspection(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthRequest,
    @Body() dto: InspectionDto,
  ) {
    // El inspector es el usuario de la sesión, nunca un ID enviado por el cliente.
    return this.inspect.execute(id, req.user.id, dto);
  }
  @Get('readings')
  @ApiOperation({ summary: 'Historial ambiental; filtrar depósito, ordenar por measuredAt' })
  readings(@Query() q: ListDto) {
    return this.list.execute('readings', q);
  }
  @Post('readings')
  @ApiOperation({ summary: 'Ingestar temperatura y humedad y evaluar alerta ambiental' })
  reading(@Body() dto: ReadingDto) {
    return this.ingest.execute({ ...dto, measuredAt: new Date(dto.measuredAt) });
  }
  @Get('alerts')
  @ApiOperation({ summary: 'Alertas paginadas; usar sort=priority&order=ASC&status=OPEN' })
  alerts(@Query() q: ListDto) {
    return this.list.execute('alerts', q);
  }
  @Post('alerts/evaluate')
  @ApiOperation({ summary: 'Evaluar vencimientos ahora; también se ejecuta cada 60 segundos' })
  check() {
    return this.evaluate.execute();
  }
}
