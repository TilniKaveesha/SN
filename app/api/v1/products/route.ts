/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextRequest } from "next/server"
import {
  successResponse,
  errorResponse,
  handleApiError,
  ApiError,
} from "@/lib/api/response"
import { validatePagination, sanitizeString } from "@/lib/api/validation"
import { verifyApiAuth, requireAdmin } from "@/lib/api/auth-utils"
import { checkRateLimit, getRateLimitKey } from "@/lib/api/rate-limit"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Convert null → undefined for strict typing
    const pagination = validatePagination(
      searchParams.get("page") ?? undefined,
      searchParams.get("limit") ?? undefined
    )

    if ("field" in pagination) {
      return errorResponse(400, "VALIDATION_ERROR", pagination.message)
    }

    const { page, limit } = pagination
    const category = sanitizeString(searchParams.get("category") ?? "")
    const search = sanitizeString(searchParams.get("search") ?? "")

    // Rate limiting per IP
    const ip = request.headers.get("x-forwarded-for") ?? "unknown"
    const rateLimitKey = getRateLimitKey(ip, "/api/v1/products")

    if (!checkRateLimit(rateLimitKey, 1000, 60 * 1000)) {
      return errorResponse(
        429,
        "RATE_LIMIT_EXCEEDED",
        "Too many requests. Please try again later."
      )
    }

    // TODO: Fetch products from database with pagination and filters
    const mockProducts = [
      {
        id: "prod_123",
        name: "Sample Product",
        description: "High-quality product",
        price: 29.99,
        category: "Electronics",
        image: "/images/product.jpg",
        stock: 100,
        rating: 4.5,
        reviews: 42,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-15T00:00:00Z",
      },
    ]

    return successResponse(
      { products: mockProducts },
      "Products fetched successfully",
      200,
      {
        page,
        limit,
        total: 100,
        totalPages: Math.ceil(100 / limit),
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
    requireAdmin(user)

    const body = await request.json()
    const { name, description, price, category, image, stock } = body

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Product name is required and must be a string"
      )
    }

    if (typeof price !== "number" || price <= 0) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Price must be a positive number"
      )
    }

    if (!category || typeof category !== "string") {
      throw new ApiError(400, "VALIDATION_ERROR", "Category is required")
    }

    if (image && typeof image === "string" && !image.startsWith("http")) {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid image URL")
    }

    // TODO: Create product in database

    const newProduct = {
      id: `prod_${Date.now()}`,
      name: sanitizeString(name),
      description: sanitizeString(description ?? ""),
      price,
      category: sanitizeString(category),
      image: image ?? "/placeholder.svg",
      stock: stock ?? 0,
      rating: 0,
      reviews: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return successResponse(newProduct, "Product created successfully", 201)
  } catch (error) {
    return handleApiError(error)
  }
}
