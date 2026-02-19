import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProposalsService } from './proposals.service';
import { Proposal, ProposalStatus } from './proposal.entity';

@ApiTags('Propostas')
@Controller('proposals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) { }

  @Get()
  @ApiOperation({ summary: 'Listar propostas' })
  async findAll(@Query('status') status?: ProposalStatus) {
    return this.proposalsService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar proposta por ID' })
  async findOne(@Param('id') id: string) {
    return this.proposalsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar proposta' })
  async create(@Body() data: { proposal: Partial<Proposal>; items: any[] }) {
    return this.proposalsService.create(data.proposal, data.items);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar proposta' })
  async update(@Param('id') id: string, @Body() proposalData: Partial<Proposal>) {
    return this.proposalsService.update(id, proposalData);
  }

  @Put(':id/items')
  @ApiOperation({ summary: 'Atualizar itens da proposta' })
  async updateItems(@Param('id') id: string, @Body() data: { items: any[] }) {
    return this.proposalsService.updateItems(id, data.items);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Enviar proposta' })
  async send(@Param('id') id: string) {
    return this.proposalsService.send(id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Aceitar proposta' })
  async accept(@Param('id') id: string) {
    return this.proposalsService.accept(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rejeitar proposta' })
  async reject(@Param('id') id: string, @Body() data: { reason?: string }) {
    return this.proposalsService.reject(id, data?.reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover proposta' })
  async remove(@Param('id') id: string) {
    await this.proposalsService.remove(id);
    return { message: 'Proposta removida com sucesso' };
  }
}
