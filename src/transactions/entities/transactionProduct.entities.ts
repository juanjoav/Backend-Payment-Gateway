import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../../products/entities/products.entity';
import { Transaction } from './transactions.entites';

@Entity()
export class TransactionProduct {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', unsigned: true })
    quantity: number;

    @ManyToOne(() => Transaction, transaction => transaction.transactionProducts)
    @JoinColumn({ name: 'transactionId' })
    transaction: Transaction;

    @ManyToOne(() => Product, product => product.transactionProducts)
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column({ name: 'transactionId' })  // Add this
    transactionId: string;

    @Column({ name: 'productId' })    // and this
    productId: number;
}
