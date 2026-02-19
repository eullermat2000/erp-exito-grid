import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Client } from './client.entity';
import { ClientDocument } from './client-document.entity'; // Assuming ClientDocument is in a separate file

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(ClientDocument)
    private documentRepository: Repository<ClientDocument>,
  ) { }

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

  async create(clientData: Partial<Client>): Promise<Client> {
    const client = this.clientRepository.create(clientData);
    return this.clientRepository.save(client);
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
}
