import { connectToDatabase } from "@/lib/db"
import Order from "@/lib/db/models/order.model"
import { type NextRequest, NextResponse } from "next/server"
import { payway } from "@/lib/payway"

/**
 * Interface for the route context object, containing dynamic parameters.
 */
interface RouteContext {
  params: {
    id: string
  }
}

/**
 * GET /api/orders/[id]
 *
 * Retrieve comprehensive order details including PayWay transaction information
 *
 * Path Parameters:
 * - id: Order ID (MongoDB ObjectId)
 *
 * For PayWay Orders, returns:
 * - Transaction ID (tran_id)
 * - Payment status and status code
 * - Total amount and paid amount
 * - Refund and discount details
 * - Payment currency
 * - APV (Approval code)
 * - Transaction date
 * - Additional PayWay-specific fields
 *
 * Example CURL request:
 * curl -X GET "https://yourapp.com/api/orders/507f1f77bcf86cd799439011"
 */
export async function GET(
  request: NextRequest,
  context: RouteContext // Using the defined interface
) {
  try {
    await connectToDatabase()

    // Access id through context.params
    const { id } = context.params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID is required",
        },
        { status: 400 }
      )
    }

    // NOTE: Ensure your Order model and its population fields are correctly typed
    const order = await Order.findById(id).populate("user", "name email")

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      )
    }

    let paywayTransactionDetails = null
    if (order.paymentMethod === "PayWay" && order.paymentResult?.id) {
      try {
        // NOTE: Ensure payway.getTransactionDetails handles the expected type for order.paymentResult.id
        paywayTransactionDetails = await payway.getTransactionDetails(order.paymentResult.id)
      } catch (error) {
        console.error("[v0] Error fetching PayWay details:", error)
        // Continue without PayWay details if API call fails
      }
    }

    const orderData = {
      orderId: order._id.toString(),
      orderNumber: order._id.toString().slice(0, 20), // Formatted order number
      totalPrice: order.totalPrice,
      itemsPrice: order.itemsPrice,
      shippingPrice: order.shippingPrice,
      taxPrice: order.taxPrice,
      isPaid: order.isPaid,
      paidAt: order.paidAt || null,
      paymentMethod: order.paymentMethod,

      paymentResult: {
        // Basic fields
        id: order.paymentResult?.id || null,
        status: order.paymentResult?.status || null,
        email_address: order.paymentResult?.email_address || null,
        pricePaid: order.paymentResult?.pricePaid || null,

        ...(order.paymentMethod === "PayWay" &&
          paywayTransactionDetails && {
            payway: {
              // Transaction Information
              tran_id: paywayTransactionDetails.tran_id || null,
              transaction_ref: paywayTransactionDetails.transaction_ref || null,

              // Payment Status
              payment_status: paywayTransactionDetails.payment_status || null,
              payment_status_code: paywayTransactionDetails.payment_status_code || null,

              // Amount Details
              total_amount: paywayTransactionDetails.total_amount || null,
              payment_amount: paywayTransactionDetails.payment_amount || null,
              paid_amount: paywayTransactionDetails.paid_amount || null,

              // Deductions
              discount_amount: paywayTransactionDetails.discount_amount || null,
              refund_amount: paywayTransactionDetails.refund_amount || null,

              // Additional Details
              payment_currency: paywayTransactionDetails.payment_currency || null,
              apv: paywayTransactionDetails.apv || null, // Approval code
              transaction_date: paywayTransactionDetails.transaction_date || null,

              // Customer Information
              email: paywayTransactionDetails.email || null,
              phone: paywayTransactionDetails.phone || null,

              // Response Message
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