import { Body, Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteAccount, Login, Logout, RefreshSession, RegisterUser } from '../../application/auth';
import { DeleteAccountDto, LoginDto, RefreshDto, RegisterDto } from '../dto/auth.dto';
import { AuthRequest, Public } from '../http';

@ApiTags('Sesión')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private login: Login,
    private register: RegisterUser,
    private refresh: RefreshSession,
    private logout: Logout,
    private deleteAccount: DeleteAccount,
  ) {}
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión: JWT access (15 min) y refresh (7 días)' })
  signIn(@Body() dto: LoginDto) {
    return this.login.execute(dto.email, dto.password);
  }
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Crear cuenta pública con consentimiento explícito' })
  signUp(@Body() dto: RegisterDto) {
    return this.register.execute(dto);
  }
  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Rotar refresh token; el anterior queda revocado' })
  renew(@Body() dto: RefreshDto) {
    return this.refresh.execute(dto.refreshToken);
  }
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Consultar perfil de la sesión' })
  me(@Req() req: AuthRequest) {
    const { sid: _sid, ...user } = req.user;
    return user;
  }
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Revocar sesión actual y sus tokens' })
  close(@Req() req: AuthRequest) {
    return this.logout.execute(req.user.sid);
  }
  @ApiBearerAuth()
  @Delete('account')
  @ApiOperation({ summary: 'Anonimizar datos personales conservando trazabilidad institucional' })
  remove(@Req() req: AuthRequest, @Body() dto: DeleteAccountDto) {
    return this.deleteAccount.execute(req.user.id, dto.password);
  }
}
