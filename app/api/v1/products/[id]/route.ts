/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/db"
import Product from "@/lib/db/models/product.model"
import { verifyToken } from "@/lib/jwt"
import { validateObjectId, validateProductUpdate } from "@/lib/api/validation"
import { successResponse, errorResponse } from "@/lib/api/response"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate MongoDB ObjectId
    if (!validateObjectId(id)) {
      return errorResponse(400, "VALIDATION_ERROR", "Invalid product ID format")
    }

    await connectToDatabase()
    const product = await Product.findById(id).lean()

    if (!product) {
      return errorResponse(404, "NOT_FOUND", "Product not found")
    }

    return successResponse(product, "Product retrieved successfully")
  } catch (error) {
    console.error("[v0] GET /api/v1/products/[id] error:", error)
    return errorResponse(500, "SERVER_ERROR", "Failed to fetch product")
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate MongoDB ObjectId
    if (!validateObjectId(id)) {
      return errorResponse(400, "VALIDATION_ERROR", "Invalid product ID format")
    }

    // Verify JWT token
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(401, "UNAUTHORIZED", "Missing or invalid authorization token")
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)

    if (!decoded) {
      return errorResponse(401, "UNAUTHORIZED", "Invalid or expired token")
    }

    const userRole = (decoded as any).role
    if (userRole !== "admin") {
      return errorResponse(403, "FORBIDDEN", "Only admins can update products")
    }

    const updates = await request.json()

    // Validate update data
    const validationError = validateProductUpdate(updates)
    if (validationError) {
      return errorResponse(400, "VALIDATION_ERROR", validationError.message)
    }

    await connectToDatabase()

    // Check if product exists
    const product = await Product.findById(id)
    if (!product) {
      return errorResponse(404, "NOT_FOUND", "Product not found")
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean()

    return successResponse(updatedProduct, "Product updated successfully")
  } catch (error) {
    console.error("[v0] PUT /api/v1/products/[id] error:", error)
    return errorResponse(500, "SERVER_ERROR", "Failed to update product")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate MongoDB ObjectId
    if (!validateObjectId(id)) {
      return errorResponse(400, "VALIDATION_ERROR", "Invalid product ID format")
    }

    // Verify JWT token
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(401, "UNAUTHORIZED", "Missing or invalid authorization token")
    }

    const token = authHeader.substring(7)
    const decoded = await verifyToken(token)

    if (!decoded) {
      return errorResponse(401, "UNAUTHORIZED", "Invalid or expired token")
    }

    const userRole = (decoded as any).role
    if (userRole !== "admin") {
      return errorResponse(403, "FORBIDDEN", "Only admins can delete products")
    }

    await connectToDatabase()

    const deletedProduct = await Product.findByIdAndDelete(id)

    if (!deletedProduct) {
      return errorResponse(404, "NOT_FOUND", "Product not found")
    }

    return successResponse({ id }, "Product deleted successfully")
  } catch (error) {
    console.error("[v0] DELETE /api/v1/products/[id] error:", error)
    return errorResponse(500, "SERVER_ERROR", "Failed to delete product")
  }
}
