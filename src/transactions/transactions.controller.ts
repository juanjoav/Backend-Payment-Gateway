import { Body, Controller, Get, InternalServerErrorException, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transactions.entites';
import { CreateTransactionDto } from './dto/createdto';
import { UpdateTransactionStatusDto } from './dto/updatedto';

@Controller('transactions')
export class TransactionsController {

    constructor(private readonly transactionsService: TransactionsService) {}

    @Post()
    async create(@Body() createTransactionDto: CreateTransactionDto): Promise<Transaction> {
        try {
            const transaction = await this.transactionsService.create(createTransactionDto);
            return transaction;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error; 
            } else {
                console.error('Error al crear transacción:', error);
                throw new InternalServerErrorException('No se pudo crear la transacción');
            }
        }
    }

    @Patch(':id')
    async updateStatus(
        @Param('id') id: string,
        @Body() updateTransactionStatusDto: UpdateTransactionStatusDto,
    ): Promise<Transaction> {
        try {
            const updatedTransaction = await this.transactionsService.updateStatus(id, updateTransactionStatusDto);
            return updatedTransaction;
        } catch (error) {
             if (error instanceof NotFoundException) {
                throw error;
            } else {
                console.error('Error al actualizar el estado de la transacción:', error);
                throw new InternalServerErrorException('No se pudo actualizar el estado de la transacción');
            }
        }
    }

    // @Get('latest')
    // async getLatestTransactions(
    // @Query('limit') limit: string = '10',
    // ): Promise<Transaction[]> {
    //     try {
    //         const parsedLimit = parseInt(limit, 10);
    //         if (isNaN(parsedLimit) || parsedLimit <= 0) {
    //             throw new InternalServerErrorException('El límite debe ser un número positivo');
    //         }
    //         const transactions = await this.transactionsService.getLatestTransactions(parsedLimit);
    //         return transactions;
    //     } catch (error) {
    //         console.error('Error al obtener las últimas transacciones:', error);
    //         throw new InternalServerErrorException('No se pudieron obtener las últimas transacciones');
    //     }
    // }
}
