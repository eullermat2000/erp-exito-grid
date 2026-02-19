import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { Client } from './client.entity';
import { ClientDocument } from './client-document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client, ClientDocument])],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule { }
