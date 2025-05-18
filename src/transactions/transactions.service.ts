import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transactions.entites';
import { FindOptionsOrder, In, IsNull, Repository } from 'typeorm';
import { Product } from 'src/products/entities/products.entity';
import { UpdateTransactionStatusDto } from './dto/updatedto';
import { CreateTransactionDto } from './dto/createdto';
import { isEmpty } from 'rxjs';
import { TransactionProduct } from './entities/transactionProduct.entities';

@Injectable()
export class TransactionsService {
    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(TransactionProduct)
        private readonly transactionProductRepository: Repository<TransactionProduct>,
    ) {}

    async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
        const { products: productsData, ...transactionData } = createTransactionDto;

        const products: Product[] = await this.productRepository.find({
            where: { id: In(productsData.map(p => p.productId)) },
        });

        if (products.length !== productsData.length) {
            throw new NotFoundException('Uno o más productos no fueron encontrados');
        }

        for (let i = 0; i < productsData.length; i++) {
            const productData = productsData[i];
            const product = products.find(p => p.id === productData.productId);
            if (!product) { 
                throw new InternalServerErrorException(`Producto con ID ${productData.productId} no encontrado en la base de datos`);
            }
            if (product.stock < productData.quantity) {
                throw new InternalServerErrorException(`No hay suficiente stock para el producto con ID ${product.id}`);
            }
        }

        const newTransaction = this.transactionRepository.create({
            ...transactionData,
            status: 'PENDING',
        });

        try {
            const savedTransaction = await this.transactionRepository.save(newTransaction);

            const transactionProducts: TransactionProduct[] = [];
            for (const productData of productsData) {
                const product = products.find(p => p.id === productData.productId);
                if (!product) {
                    throw new InternalServerErrorException(`Producto con ID ${productData.productId} no encontrado en la base de datos`);
                }
                const transactionProduct = this.transactionProductRepository.create({
                    transaction: savedTransaction,
                    product,
                    quantity: productData.quantity,
                });
                transactionProducts.push(transactionProduct);
                product.stock -= productData.quantity;
                await this.productRepository.save(product);
            }
            await this.transactionProductRepository.save(transactionProducts);

            return savedTransaction;
        } catch (error) {
            throw new InternalServerErrorException('Error al guardar la transacción: ' + error.message);
        }
    }

    async updateStatus(id: string, updateTransactionStatusDto: UpdateTransactionStatusDto): Promise<Transaction> {
        // const transactionId = parseInt(id, 10);

        if (id === undefined || id === null || id === '') {
            throw new NotFoundException(`ID de transacción "${id}" no es un número válido`);
        }
        const transaction = await this.transactionRepository.findOne({
            where: { id },

        });
        if (!transaction) {
            throw new NotFoundException(`Transacción con ID "${id}" no encontrada`);
        }

        transaction.status = updateTransactionStatusDto.status;

        try {
            const updatedTransaction = await this.transactionRepository.save(transaction);

            return updatedTransaction;
        } catch (error) {
            throw new InternalServerErrorException('Error al actualizar la transacción: ' + error.message);
        }
    }

}
