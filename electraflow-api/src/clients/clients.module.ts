import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsController, ClientPortalController } from './clients.controller';
import { ClientsService } from './clients.service';
import { Client } from './client.entity';
import { ClientDocument } from './client-document.entity';
import { ClientRequest } from './client-request.entity';
import { Work } from '../works/work.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client, ClientDocument, ClientRequest, Work])],
  controllers: [ClientsController, ClientPortalController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule { }

