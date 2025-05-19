export class CreateTransactionDto {
    cardToken: string;
    transactionNumber: string;
    products: { productId: string; quantity: number }[];
    amount: number;
    paymentDetails?: any;
    deliveryData?: any;
    email: string;
    installments: number;
    idWompy: string;
}