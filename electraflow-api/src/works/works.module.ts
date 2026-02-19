import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorksController } from './works.controller';
import { WorksService } from './works.service';
import { Work } from './work.entity';
import { WorkUpdate } from './work-update.entity';
import { Client } from '../clients/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Work, WorkUpdate, Client])],
  controllers: [WorksController],
  providers: [WorksService],
  exports: [WorksService],
})
export class WorksModule { }
