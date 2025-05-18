import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transactions.entites';
import { FindOptionsOrder, In, IsNull, Repository } from 'typeorm';
import { Product } from 'src/products/entities/products.entity';
import { UpdateTransactionStatusDto } from './dto/updatedto';
import { CreateTransactionDto } from './dto/createdto';
import { isEmpty } from 'rxjs';

// @Injectable()
// export class TransactionsService {
//     constructor(
//         @InjectRepository(Transaction)
//         private readonly transactionRepository: Repository<Transaction>,
//         @InjectRepository(Product) // Inyectar el repositorio de Product
//         private readonly productRepository: Repository<Product>,
//     ) {}

//     async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
//         const { productIds, ...transactionData } = createTransactionDto;

//         const products = await this.productRepository.find({
//             where: {
//                 id: In(productIds),
//             },
//         });

//         if (products.length !== productIds.length) {
//             throw new NotFoundException('Uno o más productos no fueron encontrados');
//         }

//         // Crear la transacción
//         const newTransaction = this.transactionRepository.create({
//             ...transactionData,
//             products, 
//             status: 'PENDING', 
//         });

//         try {
//             const savedTransaction = await this.transactionRepository.save(newTransaction);
//             await this.updateProductStock(products);
//             return savedTransaction;
//         } catch (error) {
//             throw new InternalServerErrorException('Error al guardar la transacción: ' + error.message);
//         }
//     }

//     async updateStatus(id: string, updateTransactionStatusDto: UpdateTransactionStatusDto): Promise<Transaction> {
//         const transaction = await this.transactionRepository.findOne({
//             where: { id },
//             relations: ['products'],
//         });
//         if (!transaction) {
//             throw new NotFoundException(`Transacción con ID "${id}" no encontrada`);
//         }

//         transaction.status = updateTransactionStatusDto.status;

//         try {
//             const updatedTransaction = await this.transactionRepository.save(transaction);
//             if (updateTransactionStatusDto.status === 'FAILED') {
//                 await this.revertProductStock(transaction.products);
//             }
//             return updatedTransaction;
//         } catch (error) {
//             throw new InternalServerErrorException('Error al actualizar la transacción: ' + error.message);
//         }
//     }
    
//     private async updateProductStock(products: Product[]): Promise<void> {
//         for (const product of products) {
//             if (product.stock > 0) { 
//                 product.stock -= 1; 
//                 await this.productRepository.save(product);
//             }
//         }
//     }

//     private async revertProductStock(products: Product[]): Promise<void> {
//         for (const product of products) {
//             product.stock += 1;
//             await this.productRepository.save(product);
//         }
//     }

// }

@Injectable()
export class TransactionsService {
    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
    ) {}

    async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
        const { productIds, ...transactionData } = createTransactionDto;

        const products = await this.productRepository.find({
            where: { id: In(productIds) },
        });

        if (products.length !== productIds.length) {
            throw new NotFoundException('Uno o más productos no fueron encontrados');
        }

        for (const product of products) {
            if (product.stock <= 0) {
                throw new InternalServerErrorException(`No hay suficiente stock para el producto con ID ${product.id}`);
            }
        }

        const newTransaction = this.transactionRepository.create({
            ...transactionData,
            products,
            status: 'PENDING',
        });

        try {
            const savedTransaction = await this.transactionRepository.save(newTransaction);

            await this.updateProductStock(products); 
            return savedTransaction;

        } catch (error) {
            throw new InternalServerErrorException('Error al guardar la transacción: ' + error.message);
        }
    }

    async updateStatus(id: string, updateTransactionStatusDto: UpdateTransactionStatusDto): Promise<Transaction> {

        if (id === undefined || id === null || id === '') {
            throw new NotFoundException(`ID de transacción "${id}" no es un número válido`);
        }
        const transaction = await this.transactionRepository.findOne({
            where: { id },
            relations: ['products'],
        });
        if (!transaction) {
            throw new NotFoundException(`Transacción con ID "${id}" no encontrada`);
        }

        transaction.status = updateTransactionStatusDto.status;

        try {
            const updatedTransaction = await this.transactionRepository.save(transaction);
            if (updateTransactionStatusDto.status === 'FAILED') {
                await this.revertProductStock(transaction.products);
            }
            return updatedTransaction;
        } catch (error) {
            throw new InternalServerErrorException('Error al actualizar la transacción: ' + error.message);
        }
    }

    private async updateProductStock(products: Product[]): Promise<void> {
        for (const product of products) {
            product.stock -= 1;
            await this.productRepository.save(product);
        }
    }

    private async revertProductStock(products: Product[]): Promise<void> {
        for (const product of products) {
            product.stock += 1;
            await this.productRepository.save(product);
        }
    }

    async getLatestTransactions(limit: number): Promise<Transaction[]> {
        try {
            const order: FindOptionsOrder<Transaction> = { createdAt: 'DESC' };
            return await this.transactionRepository.find({
                order,
                take: limit,
                relations: ['products']
            });
        } catch (error) {
            throw new InternalServerErrorException("Failed to retrieve latest transactions")
        }
    }
}