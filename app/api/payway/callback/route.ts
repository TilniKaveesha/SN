/* eslint-disable @typescript-eslint/no-unused-vars */
import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import Order from "@/lib/db/models/order.model"
import { sendPurchaseReceipt } from "@/emails"

export async function POST(request: NextRequest) {
  console.log("=== ABA Bank Callback ===")

  try {
    const body = await request.json()
    console.log("[v0] ABA Callback received:", body)

    const { tran_id, status, amount, order_id } = body

    if (!tran_id) {
      console.warn("[v0] Missing transaction ID in callback")
      return NextResponse.json({
        success: false,
        message: "Transaction ID is required",
      })
    }

    await connectToDatabase()

    // Find order by transaction reference or order ID
    const order = await Order.findOne({
      $or: [{ "paymentResult.id": tran_id }, { _id: order_id }],
    }).populate("user", "email name")

    if (!order) {
      console.warn(`[v0] Order not found for transaction: ${tran_id}`)
      return NextResponse.json({
        success: true,
        message: "Callback received (order not found)",
      })
    }

    console.log(`[v0] Processing callback for order: ${order._id}`)

    const userEmail = typeof order.user === "string" ? order.user : order.user?.email
    const userName = typeof order.user === "string" ? "" : order.user?.name

    // Update order payment status based on callback
    if (status === "00" || status === "APPROVED" || status === "completed") {
      if (!order.isPaid) {
        order.isPaid = true
        order.paidAt = new Date()
        order.paymentResult = {
          id: tran_id || "",
          status: "completed",
          email_address: userEmail || "",
          pricePaid: amount?.toString() || order.totalPrice.toString(),
        }
        await order.save()

        // Send purchase receipt email
        if (userEmail) {
          await sendPurchaseReceipt({ order })
          console.log(`[v0] Purchase receipt sent to ${userEmail}`)
        }

        console.log(`[v0] ✅ Order ${order._id} marked as paid`)
      }
    } else if (status === "DECLINED" || status === "CANCELLED" || status === "FAILED") {
      order.paymentResult = {
        id: order.paymentResult?.id || tran_id || "",
        status: "failed",
        email_address: order.paymentResult?.email_address || userEmail || "",
        pricePaid: order.paymentResult?.pricePaid || amount?.toString() || order.totalPrice.toString(),
      }
      await order.save()
      console.log(`[v0] ❌ Order ${order._id} payment failed with status: ${status}`)
    }

    return NextResponse.json({
      success: true,
      message: "Callback processed successfully",
      orderId: order._id.toString(),
    })
  } catch (error) {
    console.error("[v0] ABA callback error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Callback processing failed",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "ABA Bank Callback Endpoint",
    description: "Handles ABA Bank payment notifications",
    version: "2.0",
    supported_statuses: ["00", "APPROVED", "completed", "DECLINED", "CANCELLED", "FAILED"],
  })
}
