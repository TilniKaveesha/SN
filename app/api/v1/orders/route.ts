/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextRequest } from "next/server"
import {
  successResponse,
  errorResponse,
  handleApiError,
  ApiError,
} from "@/lib/api/response"
import { verifyApiAuth } from "@/lib/api/auth-utils"
import { validatePagination } from "@/lib/api/validation"

export async function GET(request: NextRequest) {
  try {
    // Convert null → undefined for strict typing
    const authHeader = request.headers.get("authorization") ?? undefined
    const user = await verifyApiAuth(authHeader)

    const { searchParams } = new URL(request.url)

    const pagination = validatePagination(
      searchParams.get("page") ?? undefined,
      searchParams.get("limit") ?? undefined,
    )

    if ("field" in pagination) {
      return errorResponse(400, "VALIDATION_ERROR", pagination.message)
    }

    const { page, limit } = pagination
    const status = searchParams.get("status")

    // TODO: Fetch user's orders from database with filters

    return successResponse(
      { orders: [] },
      "Orders fetched successfully",
      200,
      {
        page,
        limit,
        total: 0,
        totalPages: 0,
      }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Convert null → undefined for strict typing
    const authHeader = request.headers.get("authorization") ?? undefined
    const user = await verifyApiAuth(authHeader)

    const body = await request.json()
    const { items, shippingAddress, paymentMethod } = body

    // Validate required fields
    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, "VALIDATION_ERROR", "At least one item is required")
    }

    if (!shippingAddress) {
      throw new ApiError(400, "VALIDATION_ERROR", "Shipping address is required")
    }

    if (!paymentMethod) {
      throw new ApiError(400, "VALIDATION_ERROR", "Payment method is required")
    }

    // Validate address fields
    const addressFields = ["street", "city", "zipCode", "country"] as const
    for (const field of addressFields) {
      if (!shippingAddress[field]) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          `Address ${field} is required`
        )
      }
    }

    // TODO:
    // - Verify all items exist and are in stock
    // - Calculate totals (subtotal, tax, shipping)
    // - Process payment
    // - Create order in database
    // - Clear user's cart

    return successResponse(
      {
        id: `order_${Date.now()}`,
        userId: user.userId,
        status: "pending",
        items,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        shippingAddress,
        paymentMethod,
        createdAt: new Date().toISOString(),
      },
      "Order created successfully",
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}
