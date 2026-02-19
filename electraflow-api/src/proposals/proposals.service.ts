import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposal, ProposalItem, ProposalStatus } from './proposal.entity';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
    @InjectRepository(ProposalItem)
    private itemRepository: Repository<ProposalItem>,
  ) { }

  async findAll(status?: ProposalStatus): Promise<Proposal[]> {
    const where: any = {};
    if (status) where.status = status;
    return this.proposalRepository.find({
      where,
      relations: ['client', 'opportunity', 'opportunity.client', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Proposal> {
    const proposal = await this.proposalRepository.findOne({
      where: { id },
      relations: ['client', 'opportunity', 'items'],
    });
    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }
    return proposal;
  }

  private async generateProposalNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PROP-${year}-`;

    const lastProposal = await this.proposalRepository
      .createQueryBuilder('p')
      .where('p.proposalNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('p.proposalNumber', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastProposal) {
      const lastNumber = parseInt(lastProposal.proposalNumber.replace(prefix, ''), 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${String(nextNumber).padStart(3, '0')}`;
  }

  async create(proposalData: Partial<Proposal>, items: Partial<ProposalItem>[]): Promise<Proposal> {
    const proposal = this.proposalRepository.create(proposalData);
    proposal.proposalNumber = await this.generateProposalNumber();

    // Calculate totals from items
    if (items && items.length > 0) {
      const subtotal = items.reduce((sum, item) => {
        const itemTotal = Number(item.unitPrice || 0) * Number(item.quantity || 1);
        return sum + itemTotal;
      }, 0);
      proposal.subtotal = subtotal;
      proposal.total = subtotal - Number(proposal.discount || 0);
    }

    const saved = await this.proposalRepository.save(proposal);
    await this.saveProposalItems(saved.id, items);
    return this.findOne(saved.id);
  }

  async update(id: string, proposalData: Partial<Proposal>): Promise<Proposal> {
    const proposal = await this.findOne(id);
    Object.assign(proposal, proposalData);
    return this.proposalRepository.save(proposal);
  }

  async updateItems(id: string, items: Partial<ProposalItem>[]): Promise<Proposal> {
    const proposal = await this.findOne(id);

    // Remove existing items
    await this.itemRepository.delete({ proposalId: id });
    await this.saveProposalItems(id, items);

    const proposalWithItems = await this.findOne(id);
    const subtotal = proposalWithItems.items.reduce((sum, item) => sum + Number(item.total), 0);
    proposal.subtotal = subtotal;
    proposal.total = subtotal - Number(proposal.discount || 0);
    await this.proposalRepository.save(proposal);

    return proposalWithItems;
  }

  async send(id: string): Promise<Proposal> {
    const proposal = await this.findOne(id);
    proposal.status = ProposalStatus.SENT;
    proposal.sentAt = new Date();
    return this.proposalRepository.save(proposal);
  }

  async accept(id: string): Promise<Proposal> {
    const proposal = await this.findOne(id);
    proposal.status = ProposalStatus.ACCEPTED;
    proposal.acceptedAt = new Date();
    return this.proposalRepository.save(proposal);
  }

  async reject(id: string, reason?: string): Promise<Proposal> {
    const proposal = await this.findOne(id);
    proposal.status = ProposalStatus.REJECTED;
    if (reason) {
      proposal.rejectionReason = reason;
    }
    return this.proposalRepository.save(proposal);
  }

  async remove(id: string): Promise<void> {
    const proposal = await this.findOne(id);
    await this.proposalRepository.remove(proposal);
  }

  private async saveProposalItems(proposalId: string, items: Partial<ProposalItem>[]) {
    if (!items || items.length === 0) return;

    const idMapping = new Map<string, string>();
    const parents = items.filter(it => it.isBundleParent);
    const children = items.filter(it => it.parentId && !it.isBundleParent);
    const regularItems = items.filter(it => !it.isBundleParent && !it.parentId);

    // 1. Regular items
    if (regularItems.length > 0) {
      const pItems = regularItems.map(item => this.itemRepository.create({
        ...item,
        proposalId,
        total: Number(item.unitPrice || 0) * Number(item.quantity || 1),
      }));
      await this.itemRepository.save(pItems);
    }

    // 2. Parents
    for (const parent of parents) {
      const frontendId = parent.id;
      const p = this.itemRepository.create({
        ...parent,
        id: undefined,
        proposalId,
        total: Number(parent.unitPrice || 0) * Number(parent.quantity || 1),
      });
      const savedParent = await this.itemRepository.save(p);
      if (frontendId) idMapping.set(frontendId, savedParent.id);
    }

    // 3. Children
    if (children.length > 0) {
      const cItems = children.map(item => {
        const realParentId = idMapping.get(item.parentId);
        return this.itemRepository.create({
          ...item,
          id: undefined,
          proposalId,
          parentId: realParentId || (item.parentId && item.parentId.startsWith('temp-') ? null : item.parentId),
          total: Number(item.unitPrice || 0) * Number(item.quantity || 1),
        });
      });
      await this.itemRepository.save(cItems);
    }
  }
}
