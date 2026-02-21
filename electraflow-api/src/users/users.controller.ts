import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UsersService } from './users.service';
import { User, UserRole, AVAILABLE_MODULES } from './user.entity';

@ApiTags('Usuários')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários' })
  async findAll() {
    const users = await this.usersService.findAll();
    // Remove password de todos os resultados
    return users.map(({ password, ...user }) => user);
  }

  @Get('available-modules')
  @ApiOperation({ summary: 'Listar módulos disponíveis para permissões' })
  async getAvailableModules() {
    return AVAILABLE_MODULES.map(mod => ({
      id: mod,
      label: this.getModuleLabel(mod),
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    const { password, ...result } = user;
    return result;
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(@Body() userData: Partial<User>) {
    return this.usersService.create(userData);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Convidar colaborador (gera senha e envia por e-mail)' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async inviteUser(@Body() inviteData: {
    name: string;
    email: string;
    role: UserRole;
    permissions: string[];
    supervisorId?: string;
    department?: string;
    position?: string;
  }, @Request() req) {
    return this.usersService.inviteUser({
      ...inviteData,
      invitedBy: req.user.userId,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() userData: Partial<User>) {
    return this.usersService.update(id, userData);
  }

  @Put(':id/permissions')
  @ApiOperation({ summary: 'Atualizar permissões de módulos do usuário' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updatePermissions(
    @Param('id') id: string,
    @Body() body: { permissions: string[] },
  ) {
    return this.usersService.updatePermissions(id, body.permissions);
  }

  @Put(':id/supervisor')
  @ApiOperation({ summary: 'Definir supervisor do usuário' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateSupervisor(
    @Param('id') id: string,
    @Body() body: { supervisorId: string },
  ) {
    return this.usersService.updateSupervisor(id, body.supervisorId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar usuário' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'Usuário desativado com sucesso' };
  }

  private getModuleLabel(mod: string): string {
    const labels: Record<string, string> = {
      'dashboard': 'Dashboard',
      'pipeline': 'Pipeline',
      'works': 'Obras',
      'tasks': 'Tarefas',
      'proposals': 'Propostas',
      'protocols': 'Protocolos',
      'documents': 'Documentos',
      'employees': 'Funcionários',
      'users': 'Usuários',
      'clients': 'Clientes',
      'finance': 'Financeiro',
      'finance-simulator': 'Simulador Munck',
      'catalog': 'Catálogo',
      'settings': 'Configurações',
    };
    return labels[mod] || mod;
  }
}
