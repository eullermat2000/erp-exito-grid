import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment, PaymentStatus, PaymentType, TransactionCategory } from './payment.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) { }

  async findAll(status?: PaymentStatus, workId?: string): Promise<Payment[]> {
    const where: any = {};
    if (status) where.status = status;
    if (workId) where.workId = workId;
    return this.paymentRepository.find({
      where,
      relations: ['work', 'work.client'],
      order: { dueDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['work'],
    });
    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }
    return payment;
  }

  async create(paymentData: Partial<Payment>): Promise<Payment> {
    const payment = this.paymentRepository.create(paymentData);
    return this.paymentRepository.save(payment);
  }

  async update(id: string, paymentData: Partial<Payment>): Promise<Payment> {
    const payment = await this.findOne(id);
    Object.assign(payment, paymentData);
    return this.paymentRepository.save(payment);
  }

  async registerPayment(id: string, amount: number, method: string, transactionId?: string): Promise<Payment> {
    const payment = await this.findOne(id);
    payment.paidAmount += amount;

    if (payment.paidAmount >= payment.amount) {
      payment.status = PaymentStatus.PAID;
    } else {
      payment.status = PaymentStatus.PARTIAL;
    }

    payment.paidAt = new Date();
    payment.paymentMethod = method as any;
    if (transactionId) payment.transactionId = transactionId;

    return this.paymentRepository.save(payment);
  }

  async getSummary(): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [pendingIncome, overdueIncome, pendingExpense, receivedMonth, paidMonth] = await Promise.all([
      // Contas a Receber (Pendente)
      this.paymentRepository
        .createQueryBuilder('p')
        .where('p.type = :type', { type: PaymentType.INCOME })
        .andWhere('p.status IN (:...statuses)', { statuses: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] })
        .select('SUM(p.amount - p.paidAmount)', 'total')
        .getRawOne(),
      // Contas a Receber (Vencido)
      this.paymentRepository
        .createQueryBuilder('p')
        .where('p.type = :type', { type: PaymentType.INCOME })
        .andWhere('p.status = :status', { status: PaymentStatus.OVERDUE })
        .select('SUM(p.amount - p.paidAmount)', 'total')
        .getRawOne(),
      // Contas a Pagar (Pendente)
      this.paymentRepository
        .createQueryBuilder('p')
        .where('p.type = :type', { type: PaymentType.EXPENSE })
        .andWhere('p.status IN (:...statuses)', { statuses: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] })
        .select('SUM(p.amount - p.paidAmount)', 'total')
        .getRawOne(),
      // Recebido este mês
      this.paymentRepository
        .createQueryBuilder('p')
        .where('p.status = :status', { status: PaymentStatus.PAID })
        .andWhere('p.type = :type', { type: PaymentType.INCOME })
        .andWhere('p.paidAt >= :start', { start: startOfMonth })
        .select('SUM(p.paidAmount)', 'total')
        .getRawOne(),
      // Pago este mês
      this.paymentRepository
        .createQueryBuilder('p')
        .where('p.status = :status', { status: PaymentStatus.PAID })
        .andWhere('p.type = :type', { type: PaymentType.EXPENSE })
        .andWhere('p.paidAt >= :start', { start: startOfMonth })
        .select('SUM(p.paidAmount)', 'total')
        .getRawOne(),
    ]);

    return {
      toReceive: Number(pendingIncome?.total || 0),
      overdue: Number(overdueIncome?.total || 0),
      toPay: Number(pendingExpense?.total || 0),
      receivedThisMonth: Number(receivedMonth?.total || 0),
      paidThisMonth: Number(paidMonth?.total || 0),
      balance: Number(receivedMonth?.total || 0) - Number(paidMonth?.total || 0),
      currentBalance: 0, // Should be calculated from account balance if tracked
      projectedProfit: Number(pendingIncome?.total || 0) - Number(pendingExpense?.total || 0),
    };
  }

  async getDREReport(startDate: Date, endDate: Date): Promise<any> {
    const transactions = await this.paymentRepository.find({
      where: {
        paidAt: Between(startDate, endDate),
        status: PaymentStatus.PAID,
      },
      order: { category: 'ASC' },
    });

    const report: any = {
      income: {},
      expense: {},
      totalIncome: 0,
      totalExpense: 0,
      revenue: 0,
      taxes: 0,
      netRevenue: 0,
      netProfit: 0,
      netResult: 0,
    };

    transactions.forEach(t => {
      const category = t.category || TransactionCategory.OTHER;
      const amount = Number(t.paidAmount || 0);

      const typeKey = t.type === PaymentType.INCOME ? 'income' : 'expense';
      report[typeKey][category] = (report[typeKey][category] || 0) + amount;

      if (t.type === PaymentType.INCOME) {
        report.totalIncome += amount;
        report.revenue += amount;
      } else {
        report.totalExpense += amount;
        if (category === TransactionCategory.TAX) {
          report.taxes += amount;
        }
      }
    });

    report.netRevenue = report.revenue - report.taxes;
    report.netProfit = report.totalIncome - report.totalExpense;
    report.netResult = report.netProfit;

    return report;
  }

  async remove(id: string): Promise<void> {
    await this.paymentRepository.delete(id);
  }
}
