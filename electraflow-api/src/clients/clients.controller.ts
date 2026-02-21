import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientsService } from './clients.service';
import { Client } from './client.entity';
import { ClientDocument } from './client-document.entity';
import { ClientRequest } from './client-request.entity';

@ApiTags('Clientes')
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private clientsService: ClientsService) { }

  @Get()
  @ApiOperation({ summary: 'Listar clientes' })
  async findAll(@Query('q') query?: string) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  async findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar cliente (gera acesso ao portal automaticamente)' })
  async create(@Body() clientData: Partial<Client>) {
    return this.clientsService.create(clientData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  async update(@Param('id') id: string, @Body() clientData: Partial<Client>) {
    return this.clientsService.update(id, clientData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover cliente' })
  async remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Post(':id/generate-access')
  @ApiOperation({ summary: 'Gerar/resetar senha do portal para o cliente' })
  async generatePortalAccess(@Param('id') id: string) {
    return this.clientsService.generatePortalAccess(id);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Adicionar documento ao cliente' })
  async addDocument(@Param('id') id: string, @Body() data: Partial<ClientDocument>) {
    return this.clientsService.addDocument(id, data);
  }

  @Put('documents/:id')
  @ApiOperation({ summary: 'Atualizar documento do cliente' })
  async updateDocument(@Param('id') id: string, @Body() data: Partial<ClientDocument>) {
    return this.clientsService.updateDocument(id, data);
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Remover documento do cliente' })
  async removeDocument(@Param('id') id: string) {
    return this.clientsService.removeDocument(id);
  }
}

// ═══ CLIENT PORTAL CONTROLLER ═══════════════════════════════════════════════

@ApiTags('Portal do Cliente')
@Controller('client-portal')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientPortalController {
  constructor(private clientsService: ClientsService) { }

  @Get('my-works')
  @ApiOperation({ summary: 'Obras do cliente logado' })
  async getMyWorks(@Request() req) {
    return this.clientsService.getClientWorks(req.user.userId);
  }

  @Get('my-works/:id')
  @ApiOperation({ summary: 'Detalhe de obra do cliente' })
  async getMyWorkDetail(@Request() req, @Param('id') workId: string) {
    return this.clientsService.getClientWorkDetail(req.user.userId, workId);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Solicitações do cliente logado' })
  async getMyRequests(@Request() req) {
    return this.clientsService.getClientRequests(req.user.userId);
  }

  @Post('requests')
  @ApiOperation({ summary: 'Criar nova solicitação' })
  async createRequest(@Request() req, @Body() data: Partial<ClientRequest>) {
    return this.clientsService.createClientRequest(req.user.userId, data);
  }
}

