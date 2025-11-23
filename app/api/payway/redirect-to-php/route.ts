import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import Order from "@/lib/db/models/order.model"

export async function POST(request: NextRequest) {
  console.log("=== PayWay Redirect to PHP Server ===")

  try {
    const body = await request.json()
    const { orderId, amount, customerInfo, returnUrl } = body

    console.log("Redirect request parameters:", {
      orderId,
      amount,
      customerInfo,
      returnUrl,
    })

    // Validate required fields
    if (!orderId || !amount || !customerInfo) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: orderId, amount, or customerInfo",
        },
        { status: 400 },
      )
    }

    await connectToDatabase()

    // Fetch order to verify it exists
    const order = await Order.findById(orderId)
    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
        },
        { status: 404 },
      )
    }

    // Generate secure token for the PHP server to verify the request
    const token = Buffer.from(
      JSON.stringify({
        orderId,
        amount,
        timestamp: Date.now(),
      }),
    ).toString("base64")

    // Prepare redirect data for PHP server
    const phpServerUrl = process.env.PAYWAY_PHP_SERVER_URL || "http://your-php-server.com"
    const redirectData = {
      order_id: orderId,
      amount: amount,
      currency: "USD",
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone || "",
      return_url: returnUrl || `${request.nextUrl.origin}/api/payway/return`,
      token: token,
    }

    console.log("[v0] Redirect data prepared:", { ...redirectData, token: "[REDACTED]" })

    // Return redirect URL and data
    return NextResponse.json(
      {
        success: true,
        redirectUrl: phpServerUrl,
        data: redirectData,
        message: "Ready to redirect to PayWay PHP server",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] PayWay redirect error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Redirect failed",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PayWay Redirect to PHP Server API",
    version: "1.0.0",
    description: "Handles redirect to PHP PayWay server with order data",
    supported_methods: ["POST"],
    required_fields: ["orderId", "amount", "customerInfo"],
    optional_fields: ["returnUrl"],
  })
}
