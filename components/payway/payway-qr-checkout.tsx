"use client"

import { useState } from "react"
import type { PaywayCheckoutProps } from "./payway-checkout"

export default function PaywayQrCheckout(props: PaywayCheckoutProps) {
  const { orderId, amount, currency = "USD", onCancel } = props
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paywayUrl, setPaywayUrl] = useState<string | null>(null)

  const handleCreateQr = async () => {
    setError(null)
    setLoading(true)
    setPaywayUrl(null) // Clear previous URL/iframe

    try {
      // 1. Send transaction data as JSON to the Next.js API route
      // This endpoint will securely communicate with ABA Payway and return the final redirect URL.
      const response = await fetch("/api/payway/create-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount.toFixed(2), // Ensure two decimal places
          reference: orderId,
          remark: `Order ${orderId}`,
          currency: currency,
        }),
      })

      if (response.ok) {
        // 2. The server responded with the final ABA checkout URL (text/plain)
        const url = await response.text()

        // Basic validation to ensure we got a URL
        if (url.startsWith("http")) {
          setPaywayUrl(url) // Load the URL into the iframe
        } else {
          setError("Server returned an unexpected response (not a URL).")
        }
      } else {
        // 3. Handle JSON error response from the server
        const errorData = await response.json()
        setError(errorData.error || "Failed to initialize payment.")
      }
    } catch (err) {
      console.error("Checkout initiation failed:", err)
      setError("A network or internal error occurred while initiating payment.")
    } finally {
      setLoading(false)
    }
  }

  // --- Rendering Logic ---

  if (paywayUrl) {
    // If we have the ABA URL, render it inside an iframe
    return (
      <div className="p-4 w-full max-w-lg mx-auto bg-gray-50 rounded-xl shadow-2xl border border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-center text-gray-800 border-b pb-2">ABA Payway Checkout</h3>

        {/* Optional: Add a button to go back and retry */}
        <button
          onClick={() => {
            setPaywayUrl(null)
            if (onCancel) onCancel()
          }}
          className="text-blue-600 hover:text-blue-800 text-sm mb-3 focus:outline-none"
        >
          &larr; Back to Order Details
        </button>

        <p className="text-sm text-gray-500 mb-3 text-center">Viewing secure payment page for Order ID: {orderId}</p>
        <div
          className="border border-indigo-400 rounded-lg overflow-hidden w-full"
          // Set a responsive height for the iframe container
          style={{ height: "70vh", minHeight: "500px" }}
        >
          {/* CRITICAL: Load the external URL in an iframe to bypass CORS issues */}
          <iframe
            src={paywayUrl}
            title={`ABA Payway Checkout for Order ${orderId}`}
            className="w-full h-full"
            style={{ border: "none" }}
          />
        </div>
      </div>
    )
  }

  // Initial state and loading state rendering
  return (
    <div className="p-8 bg-white shadow-2xl rounded-xl max-w-sm mx-auto my-10 border border-gray-100">
      <h3 className="text-2xl font-extrabold mb-6 text-gray-800 text-center">Pay with ABA KHQR</h3>

      <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
        <p className="text-gray-600">
          Order ID: <span className="font-medium text-gray-800">{orderId}</span>
        </p>
        <p className="text-gray-600 text-2xl font-bold mt-2">
          Total: {currency} {amount.toFixed(2)}
        </p>
      </div>

      <button
        onClick={handleCreateQr}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition duration-150 ease-in-out disabled:opacity-50 flex items-center justify-center shadow-lg"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Fetching Checkout URL...
          </>
        ) : (
          "Proceed to ABA Payway Checkout"
        )}
      </button>

      {error && (
        <p className="mt-4 text-sm text-red-700 p-3 bg-red-100 border border-red-300 rounded-lg font-medium">
          Error: {error}
        </p>
      )}

      <p className="mt-4 text-xs text-gray-400 text-center">Payment secured via official ABA Payway service.</p>
    </div>
  )
}
