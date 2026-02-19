import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceService } from './finance.service';
import { Payment, PaymentStatus } from './payment.entity';

@ApiTags('Financeiro')
@Controller('finance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private financeService: FinanceService) { }

  @Get('payments')
  @ApiOperation({ summary: 'Listar pagamentos' })
  async findAll(@Query('status') status?: PaymentStatus, @Query('workId') workId?: string) {
    return this.financeService.findAll(status, workId);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Buscar pagamento por ID' })
  async findOne(@Param('id') id: string) {
    return this.financeService.findOne(id);
  }

  @Post('payments')
  @ApiOperation({ summary: 'Criar pagamento' })
  async create(@Body() paymentData: Partial<Payment>) {
    return this.financeService.create(paymentData);
  }

  @Put('payments/:id')
  @ApiOperation({ summary: 'Atualizar pagamento' })
  async update(@Param('id') id: string, @Body() paymentData: Partial<Payment>) {
    return this.financeService.update(id, paymentData);
  }

  @Post('payments/:id/register')
  @ApiOperation({ summary: 'Registrar pagamento' })
  async registerPayment(
    @Param('id') id: string,
    @Body() data: { amount: number; method: string; transactionId?: string },
  ) {
    return this.financeService.registerPayment(id, data.amount, data.method, data.transactionId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumo financeiro' })
  async getSummary() {
    return this.financeService.getSummary();
  }

  @Get('dre')
  @ApiOperation({ summary: 'Relatório DRE' })
  async getDREReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financeService.getDREReport(new Date(startDate), new Date(endDate));
  }

  @Post('payments/:id/delete') // Using POST or DELETE, let's use @Delete if available in imports
  @ApiOperation({ summary: 'Remover pagamento' })
  async remove(@Param('id') id: string) {
    return this.financeService.remove(id);
  }
}
