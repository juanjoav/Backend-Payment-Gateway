import { Transaction } from "src/transactions/entities/transactions.entites";
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

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

  @Column('text')
  imageUrl: string;

  @ManyToMany(() => Transaction, transaction => transaction.products)
  transactions: Transaction[];
}