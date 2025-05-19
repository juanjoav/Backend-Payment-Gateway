import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transactions.entites';
import { FindOptionsOrder, In, IsNull, Repository } from 'typeorm';
import { Product } from 'src/products/entities/products.entity';
import { UpdateTransactionStatusDto } from './dto/updatedto';
import { CreateTransactionDto } from './dto/createdto';
import { firstValueFrom, isEmpty } from 'rxjs';
import { TransactionProduct } from './entities/transactionProduct.entities';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';


@Injectable()
export class TransactionsService {
    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(TransactionProduct)
        private readonly transactionProductRepository: Repository<TransactionProduct>,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
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

        const acceptanceToken = await this.fetchAcceptanceToken();

        const newTransaction = this.transactionRepository.create({
            ...transactionData,
            status: 'PENDING',
            acceptanceToken: acceptanceToken,
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

    private async fetchAcceptanceToken(): Promise<string> {
        const publicKey = this.configService.get<string>('WOMPI_PUBLIC_KEY');
        const url = `https://api-sandbox.co.uat.wompi.dev/v1/merchants/${publicKey}`;
        try {
            const response = await firstValueFrom(this.httpService.get(url));
            return response.data.data.presigned_acceptance.acceptance_token;
        } catch (error) {
            throw new InternalServerErrorException('Error al obtener el acceptance_token de Wompi');
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

    protected  generateIntegrityHash(
        reference: string,
        amount: number,
        currency: string,
        expiration: string,
        integritySecret: string,
    ): string {
    const concatenated = `${reference}${amount}${currency}${expiration}${integritySecret}`;
    const hash = crypto.createHash('sha256').update(concatenated, 'utf-8').digest('hex');
    return hash;
    }

}
