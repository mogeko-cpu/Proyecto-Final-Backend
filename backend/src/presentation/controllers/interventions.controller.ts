import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListItems } from '../../application/common';
import { GetDashboard } from '../../application/dashboard';
import { AssignTask, UpdateTask } from '../../application/interventions';
import { TaskDto, TaskUpdateDto } from '../dto/interventions.dto';
import { ListDto } from '../dto/list.dto';
import { AuthRequest, Roles } from '../http';

@ApiTags('Intervenciones')
@ApiBearerAuth()
@Roles('ADMIN', 'STAFF')
@Controller('api/v1')
export class InterventionsController {
  constructor(
    private list: ListItems,
    private assign: AssignTask,
    private updateTask: UpdateTask,
    private dashboard: GetDashboard,
  ) {}
  @Get('dashboard')
  @ApiOperation({ summary: 'Indicadores, alertas priorizadas y lecturas recientes' })
  overview() {
    return this.dashboard.execute();
  }
  @Get('tasks')
  @ApiOperation({ summary: 'Listar intervenciones con filtros y ordenamiento' })
  tasks(@Query() q: ListDto) {
    return this.list.execute('tasks', q);
  }
  @Post('tasks')
  @ApiOperation({ summary: 'Asignar una intervención a personal activo' })
  task(@Body() dto: TaskDto) {
    return this.assign.execute({ ...dto, dueAt: new Date(dto.dueAt) });
  }
  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Avanzar tarea; solo responsable o administrador' })
  progress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TaskUpdateDto,
    @Req() req: AuthRequest,
  ) {
    return this.updateTask.execute(id, dto, req.user);
  }
}
