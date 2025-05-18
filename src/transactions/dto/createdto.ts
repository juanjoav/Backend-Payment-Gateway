export class CreateTransactionDto {
    transactionNumber: string;
    productIds: string[];  
    amount: number;
    paymentDetails?: any;
    deliveryData?: any;
}