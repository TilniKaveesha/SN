import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import Order from "@/lib/db/models/order.model"
import { sendPurchaseReceipt } from "@/emails"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const reference = searchParams.get("reference")
  const orderId = searchParams.get("order_id")
  const tranId = searchParams.get("tran_id")
  const status = searchParams.get("status")
  const hash = searchParams.get("hash")

  console.log("[v0] PayWay Return Handler - Params:", {
    reference,
    orderId,
    tranId,
    status,
    hash,
    allParams: Object.fromEntries(searchParams.entries()),
  })

  const transactionRef = tranId || reference || orderId

  if (!transactionRef) {
    console.error("[v0] Missing transaction reference in return URL")
    return NextResponse.redirect(new URL("/checkout?error=missing_reference", request.url))
  }

  try {
    await connectToDatabase()

    // Find the order
    const order = await Order.findOne({
      $or: [{ _id: orderId }, { _id: reference }, { "paymentResult.id": transactionRef }],
    }).populate("user", "email name")

    if (!order) {
      console.error("[v0] Order not found for reference:", transactionRef)
      return NextResponse.redirect(new URL(`/checkout?error=order_not_found&ref=${transactionRef}`, request.url))
    }

    console.log("[v0] Order found:", order._id, "- Verifying payment status")

    // Call the check-transaction API endpoint to verify payment
    const checkTxResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/payway/check-transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tran_id: transactionRef }),
    })

    if (!checkTxResponse.ok) {
      console.error("[v0] Check Transaction API error:", checkTxResponse.status)
      return NextResponse.redirect(new URL(`/checkout/status?reference=${transactionRef}&status=pending`, request.url))
    }

    const checkTxResult = await checkTxResponse.json()
    console.log("[v0] Check Transaction Result:", checkTxResult)

    // Determine payment success based on payment_status_code
    // 0 = APPROVED/PRE-AUTH (success)
    // 2 = PENDING
    // 3 = DECLINED
    // 4 = REFUNDED
    // 7 = CANCELLED
    const isSuccess = checkTxResult.payment_status_code === 0 || checkTxResult.payment_status === "APPROVED"

    if (isSuccess) {
      console.log("[v0] ✅ Payment successful - completing order")

      if (!order.isPaid) {
        order.isPaid = true
        order.paidAt = new Date()
        order.paymentResult = {
          id: order.paymentResult?.id || transactionRef,
          status: "completed",
          email_address: order.paymentResult?.email_address || (typeof order.user === "object" ? order.user.email : ""),
          pricePaid: checkTxResult.payment_amount || checkTxResult.total_amount || order.totalPrice.toString(),
        }
        await order.save()
        console.log("[v0] Order marked as paid")

        // Send purchase receipt email
        try {
          const userEmail = typeof order.user === "object" ? order.user.email : ""
          if (userEmail) {
            await sendPurchaseReceipt({ order })
            console.log(`[v0] Purchase receipt sent to ${userEmail}`)
          }
        } catch (emailError) {
          console.error("[v0] Email sending failed:", emailError)
        }
      }

      console.log("[v0] ✅ Payment successful - redirecting to status page")
      return NextResponse.redirect(new URL(`/checkout/status?reference=${transactionRef}&status=success`, request.url))
    } else {
      const paymentStatus = checkTxResult.payment_status || "UNKNOWN"
      console.log("[v0] ❌ Payment not successful - Status:", paymentStatus)

      // Redirect based on payment status
      if (paymentStatus === "CANCELLED" || paymentStatus === "DECLINED") {
        return NextResponse.redirect(
          new URL(`/checkout/${order._id}?payment=failed&reason=${paymentStatus.toLowerCase()}`, request.url),
        )
      } else if (paymentStatus === "PENDING") {
        // Still pending, redirect to status page for polling
        return NextResponse.redirect(
          new URL(`/checkout/status?reference=${transactionRef}&status=pending`, request.url),
        )
      } else {
        // Unknown status
        return NextResponse.redirect(new URL(`/checkout/${order._id}?payment=failed&reason=unknown`, request.url))
      }
    }
  } catch (error) {
    console.error("[v0] Return handler error:", error)
    return NextResponse.redirect(
      new URL(
        `/checkout?error=verification_failed&message=${encodeURIComponent(error instanceof Error ? error.message : "Unknown error")}`,
        request.url,
      ),
    )
  }
}

export async function POST(request: NextRequest) {
  // Supports both GET and POST for flexibility with different payment gateway callbacks
  // Example POST body:
  // {
  //   "tran_id": "transaction-ref-123",
  //   "reference": "order-id-456",
  //   "status": "completed",
  //   "order_id": "order-id-456"
  // }
  // This endpoint verifies the payment with PayWay API and completes the order

  try {
    const body = await request.json()
    const { tran_id, reference, order_id, status } = body

    console.log("[v0] PayWay Return Handler POST - Body:", { tran_id, reference, order_id, status })

    // Build a GET-compatible request using the POST body
    const params = new URLSearchParams({
      ...(tran_id && { tran_id }),
      ...(reference && { reference }),
      ...(order_id && { order_id }),
      ...(status && { status }),
    })

    const modifiedRequest = new Request(new URL(`?${params}`, request.url).href, {
      method: "GET",
      headers: request.headers,
    })

    return GET(modifiedRequest as NextRequest)
  } catch (error) {
    console.error("[v0] Return handler POST error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process payment return",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    )
  }
}
