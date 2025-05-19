import { Body, Controller, Get, InternalServerErrorException, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transactions.entites';
import { CreateTransactionDto } from './dto/createdto';
import { UpdateTransactionStatusDto } from './dto/updatedto';
import { ApiCreatedResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('transactions')
export class TransactionsController {

    constructor(private readonly transactionsService: TransactionsService) {}
    /**
     * Crea una nueva transacción y la envía a la pasarela de pago.
     * 
     * El cuerpo de la solicitud incluye token de tarjeta, correo, valor, cuotas,
     * y productos con cantidad. La respuesta contiene la transacción creada
     * y el ID de la pasarela.
     */
    @Post()
    @ApiOperation({ summary: 'Crear una nueva transacción' })
    @ApiResponse({ status: 201, description: 'Transacción creada exitosamente' })
    @ApiResponse({ status: 400, description: 'Datos inválidos o productos no encontrados' })
    @ApiCreatedResponse({
    description: 'Transacción creada exitosamente',
    schema: {
        example: {
        id: '297c7266-c4e9-459a-8f88-0fb28d42604e',
        transactionNumber: 'TXN-12345678965879876',
        amount: 10000,
        status: 'PENDING',
        paymentDetails: null,
        deliveryData: null,
        cardToken: 'tok_stagtest_5113_abd43821cc9d353c3aff769A003AE9F0',
        acceptanceToken: 'eyJhbGciOiJIUzI1NiJ9...',
        email: 'juanjoav010@gmail.com',
        installments: 1,
        idWompi: '15113-17476213317-97756',
        createdAt: '2025-05-19T07:22:23.172Z',
        },
    },
    })
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

    /**
     * Consulta y actualiza automáticamente el estado de todas las transacciones
     * que están actualmente en estado `PENDING`, obteniendo el estado real desde la pasarela.
     */
    @Patch('sync')
    @ApiOperation({ summary: 'Sincronizar el estado de todas las transacciones PENDING desde Wompi' })
    @ApiResponse({ status: 200, description: 'Transacciones sincronizadas exitosamente' })
    async syncAllPendingTransactions(): Promise<Transaction[]> {
        return this.transactionsService.syncAllPending();
    }

    /**
     * Permite actualizar manualmente el estado de una transacción específica por ID.
     * Usado típicamente para pruebas o administración.
     */
    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar manualmente el estado de una transacción' })
    @ApiResponse({ status: 200, description: 'Estado actualizado correctamente' })
    @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
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

    /**
     * Retorna una lista de todas las transacciones registradas.
     */
    @Get()
    @ApiOperation({ summary: 'Listar todas las transacciones' })
    @ApiResponse({ status: 200, description: 'Lista de transacciones' })
    async getAll(): Promise<Transaction[]> {
        return this.transactionsService.getAll();
    }

    // @Patch('sync')
    //     async syncAllPendingTransactions(): Promise<Transaction[]> {
    //     return this.transactionsService.syncAllPending();
    // }


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
