"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { verifyPayWayPayment } from "@/lib/actions/order.actions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import useCartStore from "@/hooks/use-cart-store"

export default function CheckoutStatusPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const urlStatus = searchParams.get("status") // Get status from URL
  const { clearCart } = useCartStore()

  const [status, setStatus] = useState<"loading" | "success" | "failed" | "error">("loading")
  const [orderId, setOrderId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [verificationAttempts, setVerificationAttempts] = useState(0)

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!reference) {
          setStatus("error")
          setMessage("No payment reference provided")
          return
        }

        if (urlStatus === "success") {
          console.log("[v0] URL indicates success, verifying payment status")
        }

        console.log("[v0] Verifying payment for reference:", reference, "attempt:", verificationAttempts + 1)

        // First try: Use verifyPayWayPayment (transaction-detail endpoint)
        let result = await verifyPayWayPayment(reference, reference)

        if (!result.success && verificationAttempts < 3) {
          console.log("[v0] Primary verification pending/failed, attempting Check Transaction API v2 as fallback")

          try {
            const checkTxResponse = await fetch("/api/payway/check-transaction", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ tran_id: reference }),
            })

            if (checkTxResponse.ok) {
              const checkTxResult = await checkTxResponse.json()
              console.log("[v0] Check Transaction API v2 result:", checkTxResult)

              // Use the more reliable Check Transaction API result
              if (checkTxResult.success) {
                result = {
                  success: true,
                  message: "Payment verified via Check Transaction API",
                }
              }
            }
          } catch (checkTxError) {
            console.warn("[v0] Check Transaction API fallback error:", checkTxError)
          }
        }

        if (!result.success && verificationAttempts < 5) {
          // Retry with exponential backoff: 1s, 2s, 4s, 8s, 16s
          const delayMs = Math.min(1000 * Math.pow(2, verificationAttempts), 16000)
          console.log(`[v0] Payment verification pending, retrying in ${delayMs}ms`)

          setTimeout(() => {
            setVerificationAttempts((prev) => prev + 1)
          }, delayMs)

          return
        }

        if (result.success) {
          clearCart()

          setStatus("success")
          setOrderId(reference)
          setMessage("Payment completed successfully!")

          setTimeout(() => {
            router.push(`/account/orders/${reference}?payment=success`)
          }, 2000)
        } else {
          setStatus("failed")
          setMessage(result.message || "Payment verification failed")
        }
      } catch (error) {
        console.error("[v0] Payment verification error:", error)
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "An error occurred while verifying payment")
      }
    }

    verifyPayment()
  }, [reference, router, clearCart, verificationAttempts, urlStatus])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {status === "loading" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
              <p className="text-center text-lg font-semibold">Verifying your payment...</p>
              <p className="text-center text-sm text-muted-foreground">
                {verificationAttempts === 0
                  ? "Please wait while we confirm your transaction"
                  : `Checking payment status (Attempt ${verificationAttempts + 1})...`}
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-center text-lg font-semibold text-green-600">{message}</p>
              <p className="text-center text-sm text-muted-foreground">Redirecting to your order details...</p>
              <div className="flex gap-2">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Continue Shopping
                  </Button>
                </Link>
                <Link href={`/account/orders/${orderId}`} className="flex-1">
                  <Button className="w-full">View Order</Button>
                </Link>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <p className="text-center text-lg font-semibold text-red-600">Payment Failed</p>
              <p className="text-center text-sm text-muted-foreground">{message}</p>
              <div className="flex gap-2">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Continue Shopping
                  </Button>
                </Link>
                {orderId && (
                  <Link href={`/checkout/${orderId}`} className="flex-1">
                    <Button className="w-full">Retry Payment</Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-yellow-100 p-3">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4v2m0-12a9 9 0 110 18 9 9 0 010-18z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-center text-lg font-semibold">Payment Status Unknown</p>
              <p className="text-center text-sm text-muted-foreground">{message}</p>
              <div className="flex gap-2">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
