import {
  generatePaywayHash
} from "./chunk-XQMIXJ7C.mjs";

// src/PaywayClient.ts
import { Buffer } from "buffer";
var base64Encode = (data) => {
  return Buffer.from(data, "utf8").toString("base64");
};
var formatReqTime = () => {
  const now = /* @__PURE__ */ new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return now.getFullYear().toString() + pad(now.getMonth() + 1) + pad(now.getDate()) + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
};
var API_BASE_URL = "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1";
var PaywayClient = class {
  merchantId;
  apiKey;
  secretKey;
  // Kept for constructor consistency
  constructor(config) {
    this.merchantId = config.merchantId;
    this.apiKey = config.apiKey;
    this.secretKey = config.secretKey;
  }
  /**
   * Generates a dynamic QR code for payment.
   */
  async createQrTransaction(orderDetails) {
    const formattedItems = orderDetails.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      // FIX: Format price to a string with exactly two decimal places
      price: item.price.toFixed(2)
    }));
    const encodedItems = base64Encode(JSON.stringify(formattedItems));
    const encodedCallbackUrl = base64Encode(orderDetails.callback_url);
    const req_time = formatReqTime();
    const formattedAmount = orderDetails.amount;
    const shippingCostString = "";
    const hashInputString = this.merchantId + // 1. Merchant ID
    orderDetails.tran_id + // 2. Transaction ID
    formattedAmount + // 3. Amount (e.g., "5.50")
    encodedItems;
    const signatureHash = generatePaywayHash(hashInputString, this.apiKey);
    const finalRequestBody = {
      merchant_id: this.merchantId,
      tran_id: orderDetails.tran_id,
      amount: formattedAmount,
      // Send as native number/float in JSON
      items: encodedItems,
      currency: orderDetails.currency,
      req_time,
      payment_method: "abakhqr",
      payment_option: "abapay_khqr",
      callback_url: encodedCallbackUrl,
      return_url: orderDetails.return_url,
      // Conditionally add remark if provided
      ...orderDetails.remark && { remark: orderDetails.remark },
      // Final hash field
      hash: signatureHash
    };
    try {
      const response = await fetch(`${API_BASE_URL}/payments/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(finalRequestBody)
      });
      const htmlContent = await response.text();
      console.log(response);
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({
          message: "Failed to parse Payway error response body."
        }));
        const errorMessage = `Payway API error (Status: ${response.status}): ${errorBody}`;
        throw new Error(errorMessage);
      }
      return htmlContent;
    } catch (error) {
      console.error("Error creating QR transaction:", error);
      throw error;
    }
  }
  // NOTE: checkTransaction method would also need to be updated with the
  // correct hash generation logic and API endpoint if it's part of the new gateway.
  async checkTransaction(tranId) {
    throw new Error("CheckTransaction method needs dedicated implementation updates for the new gateway endpoint.");
  }
};
export {
  PaywayClient
};
//# sourceMappingURL=PaywayClient.mjs.map