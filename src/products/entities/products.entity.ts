import { TransactionProduct } from "src/transactions/entities/transactionProduct.entities";
import { Transaction } from "src/transactions/entities/transactions.entites";
import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column('text')
    description: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column('int')
    stock: number;

    @OneToMany(() => TransactionProduct, transactionProduct => transactionProduct.product)
    transactionProducts: TransactionProduct[];
}