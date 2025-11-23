/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { IOrder } from "@/lib/db/models/order.model"

interface PayWayRedirectButtonProps {
  order: IOrder
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function PayWayRedirectButton({ order, onSuccess, onError }: PayWayRedirectButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleRedirectToPayWay = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/payway/redirect-to-php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order._id,
          amount: order.totalPrice,
          customerInfo: {
            name: order.shippingAddress?.fullName || "Customer",
            email: (order.user as any)?.email || "customer@example.com",
            phone: order.shippingAddress?.phone || "",
          },
          returnUrl: `${window.location.origin}/api/payway/return`,
        }),
      })

      const data = await response.json()

      if (data.success && data.redirectUrl) {
        console.log("[v0] Redirecting to PayWay PHP server:", data.redirectUrl)

        // Create a form and submit it to the PHP server
        const form = document.createElement("form")
        form.method = "POST"
        form.action = data.redirectUrl

        Object.entries(data.data).forEach(([key, value]) => {
          const input = document.createElement("input")
          input.type = "hidden"
          input.name = key
          input.value = String(value)
          form.appendChild(input)
        })

        document.body.appendChild(form)
        form.submit()

        toast({
          title: "Redirecting to PayWay",
          description: "You will be redirected to the payment page shortly...",
        })

        onSuccess?.()
      } else {
        throw new Error(data.error || "Failed to prepare redirect")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Redirect failed"
      console.error("[v0] PayWay redirect error:", errorMessage)

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })

      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleRedirectToPayWay} disabled={isLoading} className="w-full" size="lg">
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      <ExternalLink className="mr-2 h-4 w-4" />
      Proceed to PayWay Payment
    </Button>
  )
}
