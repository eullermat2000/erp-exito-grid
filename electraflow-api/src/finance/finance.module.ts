import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { Payment } from './payment.entity';
import { Measurement } from './measurement.entity';
import { MeasurementItem } from './measurement-item.entity';
import { MeasurementsService } from './measurements.service';
import { MeasurementsController } from './measurements.controller';
import { Task } from '../tasks/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Measurement, MeasurementItem, Task])],
  controllers: [FinanceController, MeasurementsController],
  providers: [FinanceService, MeasurementsService],
  exports: [FinanceService, MeasurementsService],
})
export class FinanceModule { }
