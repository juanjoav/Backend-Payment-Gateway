import { Product } from 'src/products/entities/products.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { TransactionProduct } from './transactionProduct.entities';

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    transactionNumber: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'enum', enum: ['PENDING', 'APPROVED', 'DECLINED', 'VOIDED'], default: 'PENDING' })
    status: string;

    @Column({ type: 'jsonb', nullable: true })
    paymentDetails: any;

    @Column({ type: 'jsonb', nullable: true })
    deliveryData: any;
    
    @Column({ type: 'text' })
    cardToken: string;

    @Column({ type: 'text' })
    acceptanceToken: string;

    @Column({ type: 'text' })
    email: string;

    @Column({ type: 'int' })
    installments: number;

    @Column({ type: 'text', nullable: true })
    idWompy: string;


    @OneToMany(() => TransactionProduct, transactionProduct => transactionProduct.transaction)
    transactionProducts: TransactionProduct[];

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}