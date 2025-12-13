/* eslint-disable @typescript-eslint/no-unused-vars */
import { type NextRequest, NextResponse } from "next/server"
// Assuming this path is correct based on your setup
import { PaywayClient } from "@/packages/aba-payway-pkg/src/index"

// --- Configuration (Server-Side only) ---
const MERCHANT_ID = process.env.ABA_MERCHANT_ID!
const API_KEY = process.env.ABA_API_KEY!
const SECRET_KEY = process.env.ABA_SECRET_KEY!

// This URL must be publicly accessible for ABA Payway to send the callback
const CALLBACK_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!

// CRITICAL FIX APPLIED!
const PAYWAY_WIDGET_BASE_URL = "https://checkout-sandbox.payway.com.kh/"

// Route Handlers must be exported functions matching the HTTP method
export async function POST(request: NextRequest) {
  try {
    // 1. CRITICAL CHANGE: Read incoming data as JSON (from client fetch)
    const { amount, reference, remark, currency } = await request.json()

    console.log("[v0] PayWay Create QR - Received data:", {
      amount,
      reference,
      remark,
      currency,
      referenceLength: reference?.length,
    })

    if (!amount || !reference || !currency) {
      return NextResponse.json({ error: "Missing amount, reference, or currency" }, { status: 400 })
    }

    /*if (transactionId.length > 20) {
      // If longer than 20, truncate to 20
      transactionId = transactionId.substring(0, 20)
    } else if (transactionId.length < 20) {
      // If shorter than 20, pad with zeros to reach exactly 20 characters
      transactionId = transactionId.padEnd(20, "0")
    }*/

    // 2. Initialize the Client
    const paywayClient = new PaywayClient({
      merchantId: MERCHANT_ID,
      apiKey: API_KEY,
      secretKey: SECRET_KEY,
    })

    // 3. Define URLs for Callback and Return
    const transactionUrls = {
      callback_url: `${CALLBACK_BASE_URL}/api/payway/callback`,
      return_url: `${CALLBACK_BASE_URL}/api/payway/return-handler?reference=${reference}&order_id=${reference}`,
    }

    console.log("[v0] PayWay Create QR - Transaction URLs:", transactionUrls)

    const transactionParams = {
      tran_id: reference,
      currency: currency,
      amount: amount,
      items: [{ name: `Order Ref ${reference}`, quantity: 1, price: amount }],
      remark: remark || "Online purchase",
      ...transactionUrls,
    }

    console.log("[v0] PayWay Create QR - Transaction params:", transactionParams)

    // 4. Create the Transaction (gets the raw HTML from ABA Payway)
    const finalURL = await paywayClient.createQrTransaction(transactionParams)

    console.log("[v0] PayWay Create QR - Success, URL length:", finalURL?.length)

    // 7. Return the modified HTML Widget to the browser
    return new Response(finalURL, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    })
  } catch (error) {
    console.error("[v0] ABA Payway QR creation failed:", error)
    if (error instanceof Error) {
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)
    }
    return NextResponse.json(
      {
        error: "Failed to create payment QR",
        details: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 },
    )
  }
}
