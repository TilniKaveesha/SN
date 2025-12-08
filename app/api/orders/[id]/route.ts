/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDatabase } from "@/lib/db"
import Order from "@/lib/db/models/order.model"
import { type NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { payway } from "@/lib/payway"

/**
 * GET /api/orders/[id]
 *
 * Retrieve full order details including optional PayWay transaction info.
 */
export async function GET(
  request: NextRequest,
  context: any // ← Cast to 'any' to bypass TS bug in Next.js 15.1.0
) {
  try {
    const { params } = context
    const { id } = params

    await connectToDatabase()

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      )
    }

    // Validate ObjectId early
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid order ID format" },
        { status: 400 }
      )
    }

    const order = await Order.findById(id).populate("user", "name email")

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      )
    }

    let paywayTransactionDetails = null

    if (order.paymentMethod === "PayWay" && order.paymentResult?.id) {
      try {
        paywayTransactionDetails = await payway.getTransactionDetails(
          order.paymentResult.id
        )
      } catch (error) {
        console.error("[PayWay] Error retrieving transaction:", error)
      }
    }

    const orderData = {
      orderId: order._id.toString(),
      orderNumber: order._id.toString().slice(0, 20),

      totalPrice: order.totalPrice,
      itemsPrice: order.itemsPrice,
      shippingPrice: order.shippingPrice,
      taxPrice: order.taxPrice,

      isPaid: order.isPaid,
      paidAt: order.paidAt || null,

      paymentMethod: order.paymentMethod,

      paymentResult: {
        id: order.paymentResult?.id || null,
        status: order.paymentResult?.status || null,
        email_address: order.paymentResult?.email_address || null,
        pricePaid: order.paymentResult?.pricePaid || null,

        ...(order.paymentMethod === "PayWay" &&
          paywayTransactionDetails && {
            payway: {
              tran_id: paywayTransactionDetails.tran_id || null,
              transaction_ref: paywayTransactionDetails.transaction_ref || null,

              payment_status: paywayTransactionDetails.payment_status || null,
              payment_status_code:
                paywayTransactionDetails.payment_status_code || null,

              total_amount: paywayTransactionDetails.total_amount || null,
              payment_amount: paywayTransactionDetails.payment_amount || null,
              paid_amount: paywayTransactionDetails.paid_amount || null,

              discount_amount: paywayTransactionDetails.discount_amount || null,
              refund_amount: paywayTransactionDetails.refund_amount || null,

              payment_currency: paywayTransactionDetails.payment_currency || null,
              apv: paywayTransactionDetails.apv || null,
              transaction_date: paywayTransactionDetails.transaction_date || null,

              email: paywayTransactionDetails.email || null,
              phone: paywayTransactionDetails.phone || null,

              message: paywayTransactionDetails.message || null,
              response_code: paywayTransactionDetails.response_code || null,
            },
          }),
      },

      items: order.items,
      shippingAddress: order.shippingAddress,
      expectedDeliveryDate: order.expectedDeliveryDate,
      isDelivered: order.isDelivered,
      deliveredAt: order.deliveredAt || null,

      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order retrieved successfully",
        data: orderData,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error retrieving order:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    )
  }
}
