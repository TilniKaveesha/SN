var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/PaywayClient.ts
var PaywayClient_exports = {};
__export(PaywayClient_exports, {
  PaywayClient: () => PaywayClient
});
module.exports = __toCommonJS(PaywayClient_exports);

// src/utils/security.ts
var crypto = __toESM(require("crypto"));
function generatePaywayHash(hashInputString, apiKey) {
  const hmac = crypto.createHmac("sha512", apiKey);
  hmac.update(hashInputString);
  const rawHash = hmac.digest();
  const finalHash = rawHash.toString("base64");
  return finalHash;
}

// src/PaywayClient.ts
var import_buffer = require("buffer");
var base64Encode = (data) => {
  return import_buffer.Buffer.from(data, "utf8").toString("base64");
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PaywayClient
});
//# sourceMappingURL=PaywayClient.js.map