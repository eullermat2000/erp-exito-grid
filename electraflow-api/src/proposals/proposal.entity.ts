import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Opportunity } from '../opportunities/opportunity.entity';
import { Client } from '../clients/client.entity';

export enum ProposalStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('proposals')
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  proposalNumber: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  clientId: string;

  @ManyToOne(() => Client, { eager: false })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ nullable: true })
  opportunityId: string;

  @ManyToOne(() => Opportunity, opp => opp.proposals)
  @JoinColumn({ name: 'opportunityId' })
  opportunity: Opportunity;

  @Column({ type: 'enum', enum: ProposalStatus, default: ProposalStatus.DRAFT })
  status: ProposalStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total: number;

  @Column({ nullable: true })
  validUntil: Date;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  viewedAt: Date;

  @Column({ nullable: true })
  acceptedAt: Date;

  @Column({ type: 'text', nullable: true })
  scope: string;

  @Column({ nullable: true })
  deadline: string;

  @Column({ type: 'text', nullable: true })
  paymentConditions: string;

  @Column({ type: 'text', nullable: true })
  obligations: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ProposalItem, item => item.proposal, { cascade: true })
  items: ProposalItem[];
}

@Entity('proposal_items')
export class ProposalItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  proposalId: string;

  @ManyToOne(() => Proposal, proposal => proposal.items)
  @JoinColumn({ name: 'proposalId' })
  proposal: Proposal;

  @Column()
  description: string;

  @Column({ nullable: true })
  serviceType: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  unitPrice: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total: number;

  @Column({ default: false })
  isBundleParent: boolean;

  @Column({ nullable: true })
  parentId: string;

  @ManyToOne(() => ProposalItem, (item) => item.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: ProposalItem;

  @OneToMany(() => ProposalItem, (item) => item.parent)
  children: ProposalItem[];

  @Column({ default: true })
  showDetailedPrices: boolean;

  @Column({ default: false })
  isSuggested: boolean;

  @Column({ nullable: true })
  suggestedByRule: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
