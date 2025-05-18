import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transactions.entites';
import { ProductsModule } from 'src/products/products.module';
import { TransactionProduct } from './entities/transactionProduct.entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, TransactionProduct]),
    ProductsModule
  ],
  providers: [TransactionsService],
  controllers: [TransactionsController],
  exports: [TypeOrmModule],
})
export class TransactionsModule {}
