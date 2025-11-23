// src/utils/security.ts
import * as crypto from "crypto";
function generatePaywayHash(hashInputString, apiKey) {
  const hmac = crypto.createHmac("sha512", apiKey);
  hmac.update(hashInputString);
  const rawHash = hmac.digest();
  const finalHash = rawHash.toString("base64");
  return finalHash;
}

export {
  generatePaywayHash
};
//# sourceMappingURL=chunk-XQMIXJ7C.mjs.map