import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { Document, DocumentFolder, DocumentType } from './document.entity';

@ApiTags('Documentos')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private documentsService: DocumentsService) { }

  // ========== DOCUMENTOS ==========

  @Get()
  @ApiOperation({ summary: 'Listar documentos' })
  async findAll(
    @Query('workId') workId?: string,
    @Query('type') type?: DocumentType,
    @Query('folderId') folderId?: string,
    @Query('proposalId') proposalId?: string,
  ) {
    return this.documentsService.findAll({ workId, type, folderId, proposalId });
  }

  @Get('by-work/:workId')
  @ApiOperation({ summary: 'Listar documentos por obra' })
  async findByWork(@Param('workId') workId: string) {
    return this.documentsService.findByWork(workId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar documento por ID' })
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar documento' })
  async create(@Body() docData: Partial<Document>) {
    return this.documentsService.create(docData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar documento' })
  async update(@Param('id') id: string, @Body() docData: Partial<Document>) {
    return this.documentsService.update(id, docData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover documento' })
  async remove(@Param('id') id: string) {
    await this.documentsService.remove(id);
    return { message: 'Documento removido com sucesso' };
  }

  // ========== PASTAS ==========

  @Get('folders/list')
  @ApiOperation({ summary: 'Listar todas as pastas' })
  async findFolders(@Query('workId') workId?: string) {
    return this.documentsService.findFolders(workId);
  }

  @Get('folders/root')
  @ApiOperation({ summary: 'Listar pastas raiz (com subpastas)' })
  async findRootFolders(@Query('workId') workId?: string) {
    return this.documentsService.findRootFolders(workId);
  }

  @Get('folders/:id')
  @ApiOperation({ summary: 'Buscar pasta por ID' })
  async findFolder(@Param('id') id: string) {
    return this.documentsService.findFolder(id);
  }

  @Post('folders')
  @ApiOperation({ summary: 'Criar pasta' })
  async createFolder(@Body() data: Partial<DocumentFolder>) {
    return this.documentsService.createFolder(data);
  }

  @Put('folders/:id')
  @ApiOperation({ summary: 'Atualizar pasta' })
  async updateFolder(@Param('id') id: string, @Body() data: Partial<DocumentFolder>) {
    return this.documentsService.updateFolder(id, data);
  }

  @Delete('folders/:id')
  @ApiOperation({ summary: 'Remover pasta' })
  async removeFolder(@Param('id') id: string) {
    await this.documentsService.removeFolder(id);
    return { message: 'Pasta removida com sucesso' };
  }
}
