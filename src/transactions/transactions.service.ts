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

        for (const productData of productsData) {
            const product = products.find(p => p.id === productData.productId);
            if (!product) {
            throw new InternalServerErrorException(`Producto con ID ${productData.productId} no encontrado`);
            }
            if (product.stock < productData.quantity) {
            throw new InternalServerErrorException(`No hay suficiente stock para el producto con ID ${product.id}`);
            }
        }

        const acceptanceToken = await this.fetchAcceptanceToken();

        const newTransaction = this.transactionRepository.create({
            ...transactionData,
            status: 'PENDING',
            acceptanceToken,
        });

        try {
            const savedTransaction = await this.transactionRepository.save(newTransaction);

            const transactionProducts: TransactionProduct[] = [];
            for (const productData of productsData) {
            const product = products.find(p => p.id === productData.productId);
            if (!product) continue;

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

            const wompiResponse = await this.createWompiTransaction({
            token: transactionData.cardToken,
            installments: transactionData.installments,
            reference: savedTransaction.transactionNumber,
            amountInCents: savedTransaction.amount * 100,
            currency: 'COP',
            customerEmail: transactionData.email,
            acceptanceToken,
            });

            savedTransaction.idWompy = wompiResponse.data.id;
            await this.transactionRepository.save(savedTransaction);

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

    async createWompiTransaction(data: {
        token: string;
        installments: number;
        reference: string;
        amountInCents: number;
        currency: string;
        customerEmail: string;
        acceptanceToken: string;
        }): Promise<any> {
        const privateKey = this.configService.get<string>('WOMPI_PRIVATE_KEY');

        if (!privateKey) {
            throw new InternalServerErrorException('Falta WOMPI_PRIVATE_KEY en .env');
        }

        const body = this.buildWompiTransactionPayload(data);

        const url = 'https://api-sandbox.co.uat.wompi.dev/v1/transactions';

        try {
            const response = await firstValueFrom(
            this.httpService.post(url, body, {
                headers: {
                Authorization: `Bearer ${privateKey}`,
                'Content-Type': 'application/json',
                },
            }),
            );

            return response.data;
        } catch (error) {
            console.error('Error en transacción Wompi:', error?.response?.data || error.message);
            throw new InternalServerErrorException('Error al crear transacción con Wompi');
        }
    }

    private buildWompiTransactionPayload(data: {
        token: string;
        installments: number;
        reference: string;
        amountInCents: number;
        currency: string;
        customerEmail: string;
        acceptanceToken: string;
        }): any {
        const integritySecret = this.configService.get<string>('WOMPI_INTEGRITY_SECRET');

        if (!integritySecret) {
            throw new InternalServerErrorException('Falta WOMPI_INTEGRITY_SECRET en .env');
        }

        const signatureString = `${data.reference}${data.amountInCents}${data.currency}${integritySecret}`;
        const signature = crypto.createHash('sha256').update(signatureString, 'utf8').digest('hex');

        // console.log('Signature string usado:', signatureString);
        // console.log('Firma generada:', signature);

        return {
            payment_method: {
            type: 'CARD',
            installments: data.installments,
            token: data.token,
            },
            amount_in_cents: data.amountInCents,
            reference: data.reference,
            currency: data.currency,
            customer_email: data.customerEmail,
            acceptance_token: data.acceptanceToken,
            signature,
        };
    }

    async getAll(): Promise<Transaction[]> {
        return this.transactionRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async syncTransactionStatusFromWompi(transaction: Transaction): Promise<Transaction> {
        const privateKey = this.configService.get<string>('WOMPI_PRIVATE_KEY');

        if (!privateKey || !transaction.idWompy) {
            throw new InternalServerErrorException('Faltan datos para sincronizar el estado con Wompi');
        }

        const url = `https://api-sandbox.co.uat.wompi.dev/v1/transactions/${transaction.idWompy}`;

        try {
            const response = await firstValueFrom(
            this.httpService.get(url, {
                headers: {
                Authorization: `Bearer ${privateKey}`,
                },
            }),
            );

            const wompiStatus = response.data.data.status; // Ej: APPROVED, DECLINED, VOIDED

            // Solo actualizamos si cambió
            if (transaction.status !== wompiStatus) {
            transaction.status = wompiStatus;
            await this.transactionRepository.save(transaction);
            }

            return transaction;
        } catch (error) {
            console.error('Error al consultar Wompi:', error?.response?.data || error.message);
            throw new InternalServerErrorException('No se pudo sincronizar el estado con Wompi');
        }
    }

    async syncAllPending(): Promise<Transaction[]> {
        const pendingTransactions = await this.transactionRepository.find({
            where: { status: 'PENDING' },
        });

        const updatedTransactions: Transaction[] = [];

        for (const txn of pendingTransactions) {
            try {
            const updated = await this.syncTransactionStatusFromWompi(txn);
            updatedTransactions.push(updated);
            } catch (error) {
            console.error(`Error al sincronizar transacción ${txn.idWompy}:`, error?.message || error);
            }
        }

        return updatedTransactions;
    }



    // protected  generateIntegrityHash(
    //     reference: string,
    //     amount: number,
    //     currency: string,
    //     expiration: string,
    //     integritySecret: string,
    // ): string {
    // const concatenated = `${reference}${amount}${currency}${expiration}${integritySecret}`;
    // const hash = crypto.createHash('sha256').update(concatenated, 'utf-8').digest('hex');
    // return hash;
    // }

}
