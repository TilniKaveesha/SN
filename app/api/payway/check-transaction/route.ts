import { type NextRequest, NextResponse } from "next/server"
import { payway } from "@/lib/payway"

export async function POST(request: NextRequest) {
  console.log("=== PayWay Check Transaction API ===")

  try {
    const body = await request.json()
    const { tran_id } = body

    console.log("Checking transaction status via Check Transaction API v2:", tran_id)

    if (!tran_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction ID is required",
        },
        { status: 400 },
      )
    }

    const result = await payway.checkTransaction(tran_id)

    console.log("Check Transaction API v2 result:", result)

    return NextResponse.json({
      success: result.success,
      status: result.status,
      payment_status: result.payment_status,
      payment_status_code: result.payment_status_code,
      message: result.message,
      total_amount: result.total_amount,
      payment_amount: result.payment_amount,
      payment_currency: result.payment_currency,
      apv: result.apv,
      transaction_date: result.transaction_date,
      refund_amount: result.refund_amount,
      discount_amount: result.discount_amount,
      tran_id: result.tran_id,
    })
  } catch (error) {
    console.error("PayWay check transaction error:", error)

    return NextResponse.json(
      {
        success: false,
        status: "ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PayWay Check Transaction API v2",
    version: "1.0.0",
    description: "Checks PayWay transaction status via Check Transaction API v2 endpoint",
    supported_methods: ["POST"],
    required_fields: ["tran_id"],
    possible_statuses: ["PAID", "PENDING", "FAILED", "ERROR", "REFUNDED"],
    notes: [
      "This endpoint uses the Check Transaction API v2 which is more reliable than the transaction-detail endpoint",
      "The API only checks transactions created within 7 days",
      "Used as a polling mechanism to verify payment status when return_url is unreliable",
    ],
  })
}
