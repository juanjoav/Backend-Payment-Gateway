export class CreateTransactionDto {
    transactionNumber: string;
    products: { productId: string; quantity: number }[];
    amount: number;
    paymentDetails?: any;
    deliveryData?: any;
}