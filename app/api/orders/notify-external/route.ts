import { type NextRequest, NextResponse } from "next/server"

/**
 * Webhook to notify external dev's system about new orders
 * This endpoint sends order ID and basic details to the configured webhook URL
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, orderNumber, totalAmount, paymentMethod } = await request.json()

    // Get the external webhook URL from environment variables
    const externalWebhookUrl = process.env.EXTERNAL_DEV_WEBHOOK_URL

    if (!externalWebhookUrl) {
      return NextResponse.json({ error: "External webhook URL not configured" }, { status: 400 })
    }

    // Prepare the payload for external dev
    const payload = {
      orderId,
      orderNumber,
      totalAmount,
      paymentMethod,
      timestamp: new Date().toISOString(),
      apiEndpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/orders/${orderId}`,
      instructions: "Use the apiEndpoint to fetch complete payment details",
    }

    // Send notification to external dev's webhook
    const response = await fetch(externalWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EXTERNAL_DEV_API_KEY}`, // Optional: add auth
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error("Failed to notify external dev:", response.statusText)
      return NextResponse.json({ error: "Failed to send notification to external dev" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Notification sent" })
  } catch (error) {
    console.error("Notification error:", error)
    return NextResponse.json({ error: "Failed to process notification" }, { status: 500 })
  }
}
