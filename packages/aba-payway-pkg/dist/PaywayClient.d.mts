interface ClientConfig {
    merchantId: string;
    apiKey: string;
    secretKey: string;
}
interface QrItem {
    name: string;
    quantity: number;
    price: number;
}
declare class PaywayClient {
    private merchantId;
    private apiKey;
    private secretKey;
    constructor(config: ClientConfig);
    /**
     * Generates a dynamic QR code for payment.
     */
    createQrTransaction(orderDetails: {
        tran_id: string;
        currency: 'USD' | 'KHR';
        amount: number;
        items: QrItem[];
        remark?: string;
        callback_url: string;
        return_url: string;
    }): Promise<string>;
    checkTransaction(tranId: string): Promise<void>;
}

export { PaywayClient };
