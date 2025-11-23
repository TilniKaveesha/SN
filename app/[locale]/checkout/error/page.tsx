import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Home } from "lucide-react"

export default function CheckoutErrorPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-700">Payment Processing Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-gray-700">
            An error occurred while processing your payment. Please try again later or contact support for assistance.
          </p>

          <div className="space-y-2">
            <Link href="/cart" className="block">
              <Button className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Back to Cart
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button className="w-full bg-transparent" variant="outline">
                Go Home
              </Button>
            </Link>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
            <p className="text-blue-800">
              <span className="font-semibold">Error Code:</span> CHECKOUT_ERROR
            </p>
            <p className="text-blue-800 text-xs mt-2">Reference this error code when contacting support.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
