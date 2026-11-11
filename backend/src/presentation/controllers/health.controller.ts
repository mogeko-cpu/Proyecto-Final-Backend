import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Health } from '../../application/common';
import { Public } from '../http';

@ApiTags('Operación')
@Controller()
export class HealthController {
  constructor(private health: Health) {}
  /** /api/v1/health es la ruta de la API; /health la usa el healthcheck de Docker. */
  @Public()
  @Get(['api/v1/health', 'health'])
  @ApiOperation({ summary: 'Salud de API y conexión a PostgreSQL' })
  check() {
    return this.health.execute();
  }
}
