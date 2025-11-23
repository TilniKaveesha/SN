/* eslint-disable @typescript-eslint/no-unused-vars */
// packages/aba-payway-pkg/src/PaywayClient.ts

import { generatePaywayHash } from './utils/security';
import { Buffer } from 'buffer'; // Node.js Buffer for Base64

// --- HELPER FUNCTIONS ---

// Function to safely perform Base64 encoding
const base64Encode = (data: string): string => {
  return Buffer.from(data, 'utf8').toString('base64');
};

// Function to format time to YYYYMMDDHHmmss (14 digits)
const formatReqTime = (): string => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
        now.getFullYear().toString() +
        pad(now.getMonth() + 1) + 
        pad(now.getDate()) +
        pad(now.getHours()) +
        pad(now.getMinutes()) +
        pad(now.getSeconds())
    );
};

// --- CONFIGURATION & INTERFACES ---

const API_BASE_URL = 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1';

interface ClientConfig {
    merchantId: string;
    apiKey: string;
    secretKey: string; // Used only for configuration/storage, not hashing
}

interface QrItem {
    name: string;
    quantity: number;
    price: number;
}

// Interface representing the final payload sent to ABA Payway
interface QrRequest {
    merchant_id: string;
    tran_id: string;
    currency: 'USD' | 'KHR';    
    amount: string;    
    req_time: string; // YYYYMMDDHHmmss
    payment_method: 'abakhqr';
    payment_option: 'abapay_khqr';
    
    items: string; // Base64 encoded JSON string
    callback_url: string; // Base64 encoded URL string
    
    return_url: string; // Plain string URL
    remark?: string;
    hash: string; // Calculated hash
}

// --- PAYWAY CLIENT CLASS ---

export class PaywayClient {
    private merchantId: string;
    private apiKey: string;
    private secretKey: string; // Kept for constructor consistency

    constructor(config: ClientConfig) {
        this.merchantId = config.merchantId;
        this.apiKey = config.apiKey;
        this.secretKey = config.secretKey;
    }

    /**
     * Generates a dynamic QR code for payment.
     */
    public async createQrTransaction(orderDetails: {
        tran_id: string;
        currency: 'USD' | 'KHR';
        amount: string;
        items: QrItem[]; // Accepts the QrItem array
        remark?: string;
        callback_url: string; // Accepts plain string URL
        return_url: string;   // Accepts plain string URL
    }) {


        
        

        // 1. Prepare Encoded Strings and Time
        const formattedItems = orderDetails.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            // FIX: Format price to a string with exactly two decimal places
            price: item.price, 
        }));

        // 2. Base64 Encode the JSON string of the formatted items
        const encodedItems = base64Encode(JSON.stringify(formattedItems));

        

        const encodedCallbackUrl = base64Encode(orderDetails.callback_url);
        const req_time = formatReqTime();
        
        // CRITICAL FIX: Format Amount to 2 decimal places (must be a string for hashing)
        const formattedAmount = orderDetails.amount;//.toFixed(2);
        
        // Shipping cost is assumed to be an empty string based on the minimal PHP example
        const shippingCostString = ''; 


        // 2. Build the HASHING INPUT STRING (CRITICAL)
        // Order must be: MerchantID + TranID + Amount + Items(Base64) + ShippingCost
        const hashInputString = 
                                req_time +                  // 1. Request time
                                this.merchantId +           // 2. Merchant ID
                                orderDetails.tran_id +      // 3. Transaction ID
                                formattedAmount;            // 4. Amount (e.g., "5.50")
            
            /*
            
            encodedItems +             // 4. Base64 Items
            orderDetails.currency+
            
            'abakhqr'+
            'abapay_khqr'+
            encodedCallbackUrl+
            orderDetails.return_url+
            orderDetails.remark;        // 5. Shipping Cost ('')
            */
         
        // 3. Generate the Signature Hash
        // NOTE: Uses the hashInputString and the API Key (this.apiKey)
        const signatureHash = generatePaywayHash(hashInputString, this.apiKey);
       
        //throw new Error(this.apiKey);
        
        // 4. Build the Final Request Body
        const finalRequestBody: QrRequest = {
            merchant_id: this.merchantId,
            tran_id: orderDetails.tran_id,
            amount: formattedAmount, 
            req_time: req_time, // Send as native number/float in JSON
            items: encodedItems,             
            currency: orderDetails.currency,
            
            payment_method: 'abakhqr',
            payment_option: 'abapay_khqr',           
            
            callback_url: encodedCallbackUrl, 
            return_url: orderDetails.return_url,
            
            // Conditionally add remark if provided
            ...(orderDetails.remark && { remark: orderDetails.remark }),

            // Final hash field
            hash: signatureHash, 
        };

        const post_data = {
            merchant_id:this.merchantId,
            tran_id:orderDetails.tran_id,
            amount: formattedAmount,
            req_time: req_time,
            hash: signatureHash
        }

         console.log(hashInputString);
         console.log(JSON.stringify(post_data));

        // 5. Execute the Fetch Request
        try {


            const response = await fetch(`${API_BASE_URL}/payments/purchase`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(post_data),
                redirect:'follow'
            });
                       
            

            if (response.ok && response.redirected) {

                console.log(response);
                // The response.url contains the final checkout URL after the 302 redirect
                return response.url; 
            }

            if (!response.ok) {
                // Attach detailed error body for debugging
                const errorBody = await response.json().catch(() => ({ 
                    message: 'Failed to parse Payway error response body.' 
                }));
                const errorMessage = `Payway API error (Status: ${response.status}): ${errorBody}`;
                throw new Error(errorMessage);
            }

            throw new Error("Payway API call succeeded but did not result in a payment URL redirect.");
            
        } catch (error) {
            console.error('Error creating QR transaction:', error);
            // Re-throw the error so the Next.js Route Handler can handle it
            throw error; 
        }
    }

    // NOTE: checkTransaction method would also need to be updated with the
    // correct hash generation logic and API endpoint if it's part of the new gateway.
    public async checkTransaction(tranId: string) {
        // ... (Implementation for checkTransaction goes here, following the same hashing principles)
        throw new Error("CheckTransaction method needs dedicated implementation updates for the new gateway endpoint.");
    }
}