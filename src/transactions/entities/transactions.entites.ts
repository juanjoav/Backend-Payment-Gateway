import { Product } from 'src/products/entities/products.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  transactionNumber: string; 

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; 

  @Column({ type: 'enum', enum: ['PENDING', 'SUCCESSFUL', 'FAILED'], default: 'PENDING' })
  status: string; 

  @Column({ type: 'jsonb', nullable: true })
  paymentDetails: any;

  @Column({ type: 'jsonb', nullable: true })
  deliveryData: any;


    @ManyToMany(() => Product)
    @JoinTable({
        name: 'transaction_products', 
        joinColumn: {
            name: 'transactionId',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'productId',
            referencedColumnName: 'id'
        }
    })
    products: Product[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
