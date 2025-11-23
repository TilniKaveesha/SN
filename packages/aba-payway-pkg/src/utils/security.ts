// packages/aba-payway-pkg/src/utils/security.ts

import * as crypto from 'crypto';

/**
 * Generates the Payway signature hash (HMAC-SHA512) based on concatenated fields.
 * @param hashInputString The concatenated string of (MerchantID + TranID + Amount + Items + ShippingCost).
 * @param apiKey The API Key used as the HMAC secret.
 * @returns The Base64-encoded signature hash string.
 */
export function generatePaywayHash(hashInputString: string, apiKey: string): string {
    
    // The input string is already the canonical string (b4hash)
    
    // 1. Create the HMAC hash
    const hmac = crypto.createHmac('sha512', apiKey);
    
    // 2. Update with the stringified payload
    hmac.update(hashInputString);
    
    // 3. Get the result as a raw binary buffer 
    const rawHash = hmac.digest();

    // 4. Base64 encode the binary result
    const finalHash = rawHash.toString('base64');

    return finalHash;
}