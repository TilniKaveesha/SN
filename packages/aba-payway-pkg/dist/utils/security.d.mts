/**
 * Generates the Payway signature hash (HMAC-SHA512) based on concatenated fields.
 * @param hashInputString The concatenated string of (MerchantID + TranID + Amount + Items + ShippingCost).
 * @param apiKey The API Key used as the HMAC secret.
 * @returns The Base64-encoded signature hash string.
 */
declare function generatePaywayHash(hashInputString: string, apiKey: string): string;

export { generatePaywayHash };
