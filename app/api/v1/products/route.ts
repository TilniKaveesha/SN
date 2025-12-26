/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from "next/server"
import { successResponse, errorResponse, handleApiError, ApiError } from "@/lib/api/response"
import { validatePagination, sanitizeString } from "@/lib/api/validation"
import { verifyApiAuth, requireAdmin } from "@/lib/api/auth-utils"
import { checkRateLimit, getRateLimitKey } from "@/lib/api/rate-limit"
import { connectToDatabase } from "@/lib/db"
import Product from "@/lib/db/models/product.model"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pagination = validatePagination(searchParams.get("page") ?? undefined, searchParams.get("limit") ?? undefined)

    if ("field" in pagination) {
      return errorResponse(400, "VALIDATION_ERROR", pagination.message)
    }

    const { page, limit } = pagination
    const category = sanitizeString(searchParams.get("category") || "")
    const search = sanitizeString(searchParams.get("search") || "")
    const sort = sanitizeString(searchParams.get("sort") || "latest")

    // Rate limiting per IP
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimitKey = getRateLimitKey(ip, "/api/v1/products")

    if (!checkRateLimit(rateLimitKey, 1000, 60 * 1000)) {
      return errorResponse(429, "RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later.")
    }

    await connectToDatabase()

    // Build filter query
    const queryFilter = search
      ? {
          $or: [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }],
        }
      : {}

    const categoryFilter = category ? { category: { $regex: category, $options: "i" } } : {}
    const publishedFilter = { isPublished: true }

    // Determine sort order
    const sortOrder: Record<string, 1 | -1> =
      sort === "best-selling"
        ? { numSales: -1 }
        : sort === "price-low-to-high"
          ? { price: 1 }
          : sort === "price-high-to-low"
            ? { price: -1 }
            : sort === "avg-customer-review"
              ? { avgRating: -1 }
              : { createdAt: -1 }

    // Fetch products with pagination
    const products = await Product.find({
      ...publishedFilter,
      ...queryFilter,
      ...categoryFilter,
    })
      .sort(sortOrder)
      .skip(limit * (page - 1))
      .limit(limit)
      .lean()

    // Get total count for pagination
    const totalCount = await Product.countDocuments({
      ...publishedFilter,
      ...queryFilter,
      ...categoryFilter,
    })

    // Format products response
    const formattedProducts = products.map((product: any) => ({
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      listPrice: product.listPrice,
      category: product.category,
      image: product.images?.[0] || "/placeholder.svg",
      images: product.images || [],
      brand: product.brand,
      stock: product.countInStock,
      rating: product.avgRating,
      reviews: product.numReviews,
      slug: product.slug,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }))

    return successResponse({ products: formattedProducts }, "Products fetched successfully", 200, {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? undefined
    const user = await verifyApiAuth(authHeader)
    requireAdmin(user)

    const body = await request.json()
    const { name, description, price, listPrice, category, images, brand, stock, slug } = body

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new ApiError(400, "VALIDATION_ERROR", "Product name is required and must be a string")
    }

    if (typeof price !== "number" || price <= 0) {
      throw new ApiError(400, "VALIDATION_ERROR", "Price must be a positive number")
    }

    if (typeof listPrice !== "number" || listPrice < price) {
      throw new ApiError(400, "VALIDATION_ERROR", "List price must be >= price")
    }

    if (!category || typeof category !== "string") {
      throw new ApiError(400, "VALIDATION_ERROR", "Category is required")
    }

    if (!brand || typeof brand !== "string") {
      throw new ApiError(400, "VALIDATION_ERROR", "Brand is required")
    }

    if (!slug || typeof slug !== "string") {
      throw new ApiError(400, "VALIDATION_ERROR", "Product slug is required")
    }

    if (images && !Array.isArray(images)) {
      throw new ApiError(400, "VALIDATION_ERROR", "Images must be an array")
    }

    await connectToDatabase()

    // Check if slug already exists
    const existingProduct = await Product.findOne({ slug })
    if (existingProduct) {
      throw new ApiError(400, "VALIDATION_ERROR", "Product with this slug already exists")
    }

    const newProduct = await Product.create({
      name: sanitizeString(name),
      description: sanitizeString(description || ""),
      price,
      listPrice,
      category: sanitizeString(category),
      images: images || [],
      brand: sanitizeString(brand),
      slug: sanitizeString(slug),
      countInStock: stock || 0,
      isPublished: true,
    })

    return successResponse(
      {
        id: newProduct._id.toString(),
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        listPrice: newProduct.listPrice,
        category: newProduct.category,
        slug: newProduct.slug,
        brand: newProduct.brand,
        stock: newProduct.countInStock,
        images: newProduct.images,
      },
      "Product created successfully",
      201,
    )
  } catch (error) {
    return handleApiError(error)
  }
}
