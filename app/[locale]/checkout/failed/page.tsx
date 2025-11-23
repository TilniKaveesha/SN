"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Home, RotateCcw } from "lucide-react"

export default function PaymentFailedPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-700">Payment Failed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-gray-700">
            Unfortunately, your payment could not be processed. Please try again or contact support if the problem
            persists.
          </p>

          {orderId && (
            <div className="bg-white p-4 rounded border border-red-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Order ID:</span> {orderId}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {orderId && (
              <Link href={`/checkout/${orderId}`} className="flex-1">
                <Button className="w-full" variant="destructive">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </Link>
            )}
            <Link href="/" className="flex-1">
              <Button className="w-full bg-transparent" variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Return Home
              </Button>
            </Link>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Need help?</span> Contact our support team if you continue experiencing
              issues.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
