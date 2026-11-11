import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListUsers, RegisterUser } from '../../application/auth';
import { CreateUserDto } from '../dto/auth.dto';
import { ListDto } from '../dto/list.dto';
import { Roles } from '../http';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Roles('ADMIN', 'STAFF')
@Controller('api/v1/users')
export class UsersController {
  constructor(
    private listUsers: ListUsers,
    private register: RegisterUser,
  ) {}
  @Get()
  @ApiOperation({ summary: 'Directorio de usuarios, sin contraseñas ni tokens' })
  list(@Query() q: ListDto) {
    return this.listUsers.execute(q);
  }
  @Roles('ADMIN')
  @Post()
  @ApiOperation({ summary: 'Crear usuario con rol institucional; solo administrador' })
  create(@Body() dto: CreateUserDto) {
    return this.register.execute(dto, dto.role);
  }
}
