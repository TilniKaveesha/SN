/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextRequest } from "next/server"
import { successResponse, handleApiError, ApiError } from "@/lib/api/response"
import { verifyApiAuth } from "@/lib/api/auth-utils"
import { validateNumber } from "@/lib/api/validation"

export async function POST(request: NextRequest) {
  try {
    // Convert null → undefined for strict typing
    const authHeader = request.headers.get("authorization") ?? undefined
    const user = await verifyApiAuth(authHeader)

    const body = await request.json()
    const { orderId, paymentMethod, amount } = body

    // Validate required fields
    if (!orderId) {
      throw new ApiError(400, "VALIDATION_ERROR", "Order ID is required")
    }

    if (!paymentMethod) {
      throw new ApiError(400, "VALIDATION_ERROR", "Payment method is required")
    }

    const amountError = validateNumber(amount, "amount", 0.01)
    if (amountError) {
      throw new ApiError(400, "VALIDATION_ERROR", amountError.message)
    }

    // TODO:
    // - Verify order exists and belongs to user
    // - Process payment with payment gateway (Stripe, PayPal, etc.)
    // - Update order payment status in database
    // - Send payment confirmation email

    return successResponse(
      {
        paymentId: `pay_${Date.now()}`,
        orderId,
        amount,
        status: "completed",
        transactionId: `txn_${Math.random().toString(36).substring(7)}`,
        paymentMethod,
        processedAt: new Date().toISOString(),
      },
      "Payment processed successfully",
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}
