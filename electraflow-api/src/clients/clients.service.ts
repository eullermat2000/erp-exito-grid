import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Client } from './client.entity';
import { ClientDocument } from './client-document.entity';
import { ClientRequest, RequestStatus } from './client-request.entity';
import { Work } from '../works/work.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(ClientDocument)
    private documentRepository: Repository<ClientDocument>,
    @InjectRepository(ClientRequest)
    private requestRepository: Repository<ClientRequest>,
    @InjectRepository(Work)
    private workRepository: Repository<Work>,
  ) { }

  // ═══ CRUD ═════════════════════════════════════════════════════════════════

  async findAll(query?: string): Promise<Client[]> {
    if (query) {
      return this.clientRepository.find({
        where: [
          { name: Like(`%${query}%`) },
          { email: Like(`%${query}%`) },
          { document: Like(`%${query}%`) },
        ],
        relations: ['documents'],
        order: { createdAt: 'DESC' },
      });
    }
    return this.clientRepository.find({ relations: ['documents'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['leads', 'works', 'documents'],
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return client;
  }

  async create(clientData: Partial<Client>): Promise<any> {
    // Auto-generate portal password
    const plainPassword = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const client = this.clientRepository.create({
      ...clientData,
      password: hashedPassword,
      hasPortalAccess: true,
    });
    const saved = await this.clientRepository.save(client);

    // Return with plain password so admin can share with client
    const { password: _, ...result } = saved;
    return { ...result, portalPassword: plainPassword };
  }

  async update(id: string, clientData: Partial<Client>): Promise<Client> {
    const client = await this.findOne(id);
    Object.assign(client, clientData);
    return this.clientRepository.save(client);
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await this.clientRepository.remove(client);
  }

  // ═══ PORTAL ACCESS ════════════════════════════════════════════════════════

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async generatePortalAccess(clientId: string): Promise<{ portalPassword: string }> {
    const client = await this.findOne(clientId);
    const plainPassword = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    client.password = hashedPassword;
    client.hasPortalAccess = true;
    await this.clientRepository.save(client);
    return { portalPassword: plainPassword };
  }

  // ═══ PORTAL QUERIES ═══════════════════════════════════════════════════════

  async getClientWorks(clientId: string): Promise<Work[]> {
    return this.workRepository.find({
      where: { clientId },
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });
  }

  async getClientWorkDetail(clientId: string, workId: string): Promise<Work> {
    const work = await this.workRepository.findOne({
      where: { id: workId, clientId },
      relations: ['client', 'tasks', 'documents'],
    });
    if (!work) throw new NotFoundException('Obra não encontrada');
    return work;
  }

  async getClientRequests(clientId: string): Promise<ClientRequest[]> {
    return this.requestRepository.find({
      where: { clientId },
      relations: ['work'],
      order: { createdAt: 'DESC' },
    });
  }

  async createClientRequest(clientId: string, data: Partial<ClientRequest>): Promise<ClientRequest> {
    const request = this.requestRepository.create({
      ...data,
      clientId,
      status: RequestStatus.OPEN,
    });
    const saved = await this.requestRepository.save(request);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  // ═══ DOCUMENTS ════════════════════════════════════════════════════════════

  async addDocument(clientId: string, docData: Partial<ClientDocument>): Promise<ClientDocument> {
    const doc = this.documentRepository.create({
      ...docData,
      clientId,
    });
    return this.documentRepository.save(doc);
  }

  async updateDocument(id: string, docData: Partial<ClientDocument>): Promise<ClientDocument> {
    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    Object.assign(doc, docData);
    return this.documentRepository.save(doc);
  }

  async removeDocument(id: string): Promise<void> {
    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    await this.documentRepository.remove(doc);
  }
}

