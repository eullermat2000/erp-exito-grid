import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { User } from './user.entity';

@ApiTags('Usuários')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário' })
  async create(@Body() userData: Partial<User>) {
    return this.usersService.create(userData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  async update(@Param('id') id: string, @Body() userData: Partial<User>) {
    return this.usersService.update(id, userData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar usuário' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'Usuário desativado com sucesso' };
  }
}
