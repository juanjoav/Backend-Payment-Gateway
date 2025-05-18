import { Product } from 'src/products/entities/products.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  transactionNumber: string; // Número de transacción único

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // Monto total de la transacción

  @Column({ type: 'enum', enum: ['PENDING', 'SUCCESSFUL', 'FAILED'], default: 'PENDING' })
  status: string; // Estado de la transacción

  @Column({ type: 'jsonb', nullable: true })
  paymentDetails: any; // Detalles del pago (podría variar según la pasarela)

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
