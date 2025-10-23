import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import Order from "@/lib/db/models/order.model"
import { payway } from "@/lib/payway"

export async function POST(request: NextRequest) {
  console.log("[v0] === PayWay Callback Verification ===")

  try {
    const body = await request.json()
    const { orderId, transactionId } = body

    console.log("[v0] Verification request:", { orderId, transactionId })

    if (!orderId && !transactionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Either orderId or transactionId is required",
        },
        { status: 400 },
      )
    }

    await connectToDatabase()

    // Find order
    const order = await Order.findById(orderId).populate("user", "email name")

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 },
      )
    }

    console.log("[v0] Order found:", {
      orderId: order._id,
      isPaid: order.isPaid,
      paymentStatus: order.paymentResult?.status,
      transactionId: order.paymentResult?.id,
    })

    // If we have a transaction ID, verify with PayWay API
    let paywayStatus = null
    if (transactionId || order.paymentResult?.id) {
      const tran_id = transactionId || order.paymentResult?.id
      paywayStatus = await payway.getTransactionDetails(tran_id)

      console.log("[v0] PayWay API response:", paywayStatus)
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order._id.toString(),
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        paymentStatus: order.paymentResult?.status,
        transactionId: order.paymentResult?.id,
        amount: order.totalPrice,
      },
      payway: paywayStatus,
      verification: {
        orderPaid: order.isPaid,
        callbackReceived: !!order.paymentResult?.id,
        status: order.isPaid ? "✅ VERIFIED" : "⏳ PENDING",
      },
    })
  } catch (error) {
    console.error("[v0] Verification error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Verification failed",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PayWay Callback Verification Endpoint",
    description: "Verifies if payment callback was received and processed",
    usage: "POST with { orderId, transactionId }",
  })
}
