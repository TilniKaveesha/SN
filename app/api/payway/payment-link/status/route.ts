/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server"
import { paywayPaymentLinks } from "@/lib/payway-payment-links"
import { PaymentLink } from "@/lib/db/models/payment-link.model"
import { connectToDatabase } from "@/lib/db"
import { type Types } from "mongoose"

// Full Mongoose document type
interface PaymentLinkDocument {
  _id: Types.ObjectId
  orderId: string
  paymentLink: string
  paymentLinkId: string
  amount: number
  currency: string
  status: string
  customerInfo?: {
    name?: string
    email?: string
    phone?: string
  }
  createdAt: Date
  expiresAt?: Date
  paidAt?: Date
}

// Lean object type (plain JS object)
interface PaymentLinkLean {
  _id: string
  orderId: string
  paymentLink: string
  paymentLinkId: string
  amount: number
  currency: string
  status: string
  customerInfo?: {
    name?: string
    email?: string
    phone?: string
  }
  createdAt: Date
  expiresAt?: Date
  paidAt?: Date
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Payment Link Status Check API called")

    const body = await request.json()
    const { paymentLinkId, orderId } = body as { paymentLinkId?: string; orderId?: string }

    if (!paymentLinkId && !orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment link ID or order ID is required",
        },
        { status: 400 },
      )
    }

    console.log("🔍 Checking status for:", { paymentLinkId, orderId })

    // Connect to DB and fetch payment link
    let dbPaymentLink: PaymentLinkLean | null = null
    try {
      await connectToDatabase()

      const query: Record<string, string> = {}
      if (orderId) query.orderId = orderId
      if (paymentLinkId) query.paymentLinkId = paymentLinkId

      dbPaymentLink = await PaymentLink.findOne(query).lean<PaymentLinkLean>()
      console.log("🔍 Database payment link:", dbPaymentLink ? "Found" : "Not found")
    } catch (dbError) {
      console.error("🔍 Database query error:", dbError)
    }

    // Check PayWay status if we have a paymentLinkId
    let paywayStatus: any = null
    const linkIdToCheck = paymentLinkId || dbPaymentLink?.paymentLinkId
    if (linkIdToCheck) {
      console.log("🔍 Checking PayWay status for link ID:", linkIdToCheck)
      paywayStatus = await paywayPaymentLinks.getPaymentLinkStatus(linkIdToCheck)
      console.log("🔍 PayWay status response:", paywayStatus)
    }

    // Update DB if status changed
    if (dbPaymentLink && paywayStatus?.success && paywayStatus.status) {
      try {
        const currentStatus = dbPaymentLink.status
        const newStatus = paywayStatus.status.toLowerCase()
        if (currentStatus !== newStatus) {
          await PaymentLink.findByIdAndUpdate(dbPaymentLink._id, {
            status: newStatus,
            updatedAt: new Date(),
            ...(newStatus === "paid" && !dbPaymentLink.paidAt && { paidAt: new Date() }),
          })
          console.log("🔍 Updated payment link status from", currentStatus, "to", newStatus)
          // Reflect new status in lean object
          dbPaymentLink.status = newStatus
          if (newStatus === "paid") dbPaymentLink.paidAt = new Date()
        }
      } catch (updateError) {
        console.error("🔍 Failed to update payment link status:", updateError)
      }
    }

    // Prepare response
    const response = {
      success: true,
      database: dbPaymentLink || null,
      payway: paywayStatus?.success
        ? {
            status: paywayStatus.status,
            status_message: paywayStatus.status_message,
            payment_link_id: paywayStatus.payment_link_id,
            total_amount: paywayStatus.total_amount,
            total_transactions: paywayStatus.total_transactions,
          }
        : null,
      combined_status: paywayStatus?.status || dbPaymentLink?.status || "unknown",
      is_paid: (paywayStatus?.status === "PAID" || dbPaymentLink?.status === "paid") ?? false,
    }

    console.log("🔍 Final response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("🔍 Payment status check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check payment status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const paymentLinkId = searchParams.get("paymentLinkId")
  const orderId = searchParams.get("orderId")

  if (!paymentLinkId && !orderId) {
    return NextResponse.json(
      {
        success: false,
        error: "Payment link ID or order ID is required",
      },
      { status: 400 },
    )
  }

  // Convert GET to POST internally
  const mockRequest = {
    json: async () => ({ paymentLinkId, orderId }),
  } as NextRequest

  return POST(mockRequest)
}
