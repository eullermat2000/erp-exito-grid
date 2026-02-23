import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Opportunity } from '../opportunities/opportunity.entity';
import { Client } from '../clients/client.entity';
import { FiscalInvoice } from '../fiscal/fiscal.entity';

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

  // ═══════════════════════════════════════════════════════════════
  // Campos de Contrato / Proposta Comercial Profissional
  // ═══════════════════════════════════════════════════════════════

  @Column({ type: 'text', nullable: true })
  workDescription: string;             // Descrição/nome da obra

  @Column({ type: 'text', nullable: true })
  workAddress: string;                 // Endereço da obra

  @Column({ type: 'text', nullable: true })
  materialFornecimento: string;        // Cláusula fornecimento de materiais

  @Column({ type: 'text', nullable: true })
  materialFaturamento: string;         // Cláusula faturamento direto

  @Column({ type: 'text', nullable: true })
  serviceDescription: string;          // Cláusula execução do serviço

  @Column({ type: 'text', nullable: true })
  paymentBank: string;                 // Dados bancários

  @Column({ type: 'text', nullable: true })
  paymentDueCondition: string;         // Condição de vencimento/NF

  @Column({ type: 'int', nullable: true })
  workDeadlineDays: number;            // Prazo em dias

  @Column({ type: 'text', nullable: true })
  contractorObligations: string;       // Obrigações CONTRATADA

  @Column({ type: 'text', nullable: true })
  clientObligations: string;           // Obrigações CONTRATANTE

  @Column({ type: 'text', nullable: true })
  generalProvisions: string;           // Disposições gerais

  @Column({ nullable: true })
  activityType: string;                // Tipo de atividade (extensao_rede, energia_solar, etc.)

  // ═══════════════════════════════════════════════════════════════
  // Visibilidade dos Itens no PDF
  // 'detailed' = tabelas com preços unitários
  // 'summary'  = texto comercial + valor total (sem detalhamento)
  // 'text_only'= apenas texto comercial descritivo, sem valores unitários
  // ═══════════════════════════════════════════════════════════════

  @Column({ nullable: true, default: 'detailed' })
  itemVisibilityMode: string;            // 'detailed' | 'summary' | 'text_only'

  @Column({ type: 'text', nullable: true })
  materialSummaryText: string;           // Texto comercial para materiais (quando não detalhado)

  @Column({ type: 'text', nullable: true })
  serviceSummaryText: string;            // Texto comercial para serviços (quando não detalhado)

  @Column({ nullable: true })
  summaryTotalLabel: string;             // Label do valor total no modo resumo (ex: "Valor Global")

  // ═══════════════════════════════════════════════════════════════
  // Custos Adicionais (logístico, administrativo, corretagem/seguro)
  // Modo: 'visible' = mostrar ao cliente | 'embedded' = embutir no preço
  // ═══════════════════════════════════════════════════════════════

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  logisticsCostValue: number;            // Valor do custo logístico

  @Column({ nullable: true, default: 'visible' })
  logisticsCostMode: string;             // 'visible' | 'embedded'

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  logisticsCostPercent: number;          // Percentual sobre material (alternativa ao valor fixo)

  @Column({ nullable: true, default: 'material' })
  logisticsCostApplyTo: string;          // 'material' | 'service' | 'both' (onde embutir)

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  adminCostValue: number;               // Custo administrativo

  @Column({ nullable: true, default: 'visible' })
  adminCostMode: string;                // 'visible' | 'embedded'

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  adminCostPercent: number;             // Percentual alternativo

  @Column({ nullable: true, default: 'material' })
  adminCostApplyTo: string;             // 'material' | 'service' | 'both'

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  brokerageCostValue: number;           // Corretagem / Seguro

  @Column({ nullable: true, default: 'visible' })
  brokerageCostMode: string;            // 'visible' | 'embedded'

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  brokerageCostPercent: number;         // Percentual alternativo

  @Column({ nullable: true, default: 'material' })
  brokerageCostApplyTo: string;         // 'material' | 'service' | 'both'

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  insuranceCostValue: number;           // Seguro

  @Column({ nullable: true, default: 'visible' })
  insuranceCostMode: string;            // 'visible' | 'embedded'

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  insuranceCostPercent: number;         // Percentual alternativo

  @Column({ nullable: true, default: 'material' })
  insuranceCostApplyTo: string;         // 'material' | 'service' | 'both'

  // ═══════════════════════════════════════════════════════════════
  // Conformidade Normativa
  // ═══════════════════════════════════════════════════════════════

  @Column({ type: 'text', nullable: true })
  complianceText: string;              // Texto de conformidade normativa (NRs)

  // ═══════════════════════════════════════════════════════════════
  // Assinatura Digital
  // ═══════════════════════════════════════════════════════════════

  @Column({ nullable: true, unique: true })
  signatureToken: string;              // Token JWT para link de assinatura

  @Column({ nullable: true })
  signatureTokenExpiresAt: Date;       // Validade do token

  @Column({ nullable: true })
  signedAt: Date;                      // Data/hora da assinatura

  @Column({ nullable: true })
  signedByName: string;                // Nome de quem assinou

  @Column({ nullable: true })
  signedByDocument: string;            // CPF/CNPJ do signatário

  @Column({ nullable: true })
  signedByIP: string;                  // IP do signatário

  @Column({ type: 'text', nullable: true })
  signedByUserAgent: string;           // User-Agent do navegador

  @Column({ nullable: true })
  signatureVerificationCode: string;   // Código de verificação (6 dígitos)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ProposalItem, item => item.proposal, { cascade: true })
  items: ProposalItem[];

  @OneToMany(() => FiscalInvoice, invoice => invoice.proposal)
  fiscalInvoices: FiscalInvoice[];
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
  unit: string;                          // Unidade (un, m, CDA, etc.)

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
