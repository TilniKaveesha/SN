/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PayWay Payment Methods Supported
 */
export enum PayWayPaymentMethod {
  // ABA Bank KHQR - QR code payment
  ABA_KHQR = "abapay_khqr",
  // ABA Bank KHQR Deeplink - Mobile app deeplink
  ABA_KHQR_DEEPLINK = "abapay_khqr_deeplink",
  // Card payments (Visa, Mastercard, etc.)
  CARDS = "cards",
  // Alipay wallet
  ALIPAY = "alipay",
  // WeChat wallet
  WECHAT = "wechat",
  // Google Pay
  GOOGLE_PAY = "google_pay",
}

/**
 * PayWay Transaction Types
 */
export enum PayWayTransactionType {
  PURCHASE = "purchase",
  PRE_AUTH = "pre-auth",
}

/**
 * PayWay View Types
 */
export enum PayWayViewType {
  HOSTED_VIEW = "hosted_view",
  POPUP = "popup",
}

/**
 * PayWay Currency
 */
export enum PayWayCurrency {
  USD = "USD",
  KHR = "KHR",
}

/**
 * PayWay Payment Status
 */
export enum PayWayPaymentStatus {
  PENDING = "pending",
  APPROVED = "APPROVED",
  COMPLETED = "completed",
  DECLINED = "DECLINED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
}

/**
 * PayWay Callback Response
 */
export interface PayWayCallbackData {
  tran_id: string
  status: string
  amount?: number
  order_id?: string
  [key: string]: any
}

/**
 * PayWay Payment Result stored in Order
 */
export interface PaymentResult {
  id: string
  status: string
  email_address: string
  pricePaid?: string
}

/**
 * PayWay Checkout Response
 */
export interface PayWayCheckoutResponse {
  success: boolean
  response_type?: string
  checkout_html?: string
  checkout_url?: string
  transaction_ref?: string
  qr_string?: string
  abapay_deeplink?: string
  status?: string
  error?: string
}

/**
 * PayWay Transaction Details
 */
export interface PayWayTransactionDetails {
  tran_id: string
  status: string
  amount: number
  currency: string
  payment_method: PayWayPaymentMethod
  created_at: Date
  completed_at?: Date
}
