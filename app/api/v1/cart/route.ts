/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextRequest } from "next/server"
import { successResponse, handleApiError, ApiError } from "@/lib/api/response"
import { verifyApiAuth } from "@/lib/api/auth-utils"
import { validateNumber } from "@/lib/api/validation"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? undefined
    const user = await verifyApiAuth(authHeader)

    // TODO: Fetch cart items for user from database

    return successResponse({
      items: [],
      total: 0,
      itemCount: 0,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? undefined
    const user = await verifyApiAuth(authHeader)

    const body = await request.json()
    const { productId, quantity } = body

    if (!productId) {
      throw new ApiError(400, "VALIDATION_ERROR", "Product ID is required")
    }

    const quantityError = validateNumber(quantity, "quantity", 1)
    if (quantityError) {
      throw new ApiError(400, "VALIDATION_ERROR", quantityError.message)
    }

    // TODO: Add item to cart in database

    return successResponse(
      {
        id: `cart_item_${Date.now()}`,
        productId,
        quantity,
        addedAt: new Date().toISOString(),
      },
      "Item added to cart",
      201,
    )
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? undefined
    const user = await verifyApiAuth(authHeader)

    // TODO: Clear cart in database

    return successResponse({ cleared: true }, "Cart cleared successfully")
  } catch (error) {
    return handleApiError(error)
  }
}
