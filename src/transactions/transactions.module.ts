import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transactions.entites';
import { ProductsModule } from 'src/products/products.module';
import { TransactionProduct } from './entities/transactionProduct.entities';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, TransactionProduct]),
    ProductsModule,
    HttpModule,
    ConfigModule
  ],
  providers: [TransactionsService],
  controllers: [TransactionsController],
  exports: [TypeOrmModule],
})
export class TransactionsModule {}
