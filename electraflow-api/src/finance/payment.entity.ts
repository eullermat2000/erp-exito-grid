import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Work } from '../works/work.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  PIX = 'pix',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  BOLETO = 'boleto',
  CASH = 'cash',
}

export enum PaymentType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum TransactionCategory {
  MATERIALS = 'materials',
  LABOR = 'labor',
  EQUIPMENT = 'equipment',
  TAX = 'tax',
  OFFICE = 'office',
  PROJECT = 'project',
  UTILITIES = 'utilities',
  MARKETING = 'marketing',
  OTHER = 'other',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  workId: string;

  @ManyToOne(() => Work)
  @JoinColumn({ name: 'workId' })
  work: Work;

  @Column({ nullable: true })
  clientId: string;

  @Column({ nullable: true })
  measurementId: string;

  @Column({ type: 'enum', enum: PaymentType, default: PaymentType.INCOME })
  type: PaymentType;

  @Column({ type: 'enum', enum: TransactionCategory, nullable: true })
  category: TransactionCategory;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  billingDate: Date;

  @Column({ nullable: true })
  scheduledPaymentDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxWithholding: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxCost: number;

  @Column({ type: 'simple-array', nullable: true })
  attachments: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
