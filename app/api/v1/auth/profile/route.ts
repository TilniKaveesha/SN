/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { connectToDatabase } from "@/lib/db"
import User from "@/lib/db/models/user.model"
import { errorResponse, successResponse } from "@/lib/api/response"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(401, "UNAUTHORIZED", "No token provided")
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload || (payload as any).type !== "access") {
      return errorResponse(401, "INVALID_TOKEN", "Invalid or expired token")
    }

    await connectToDatabase()
    const user = await User.findById((payload as any).userId)

    if (!user) {
      return errorResponse(404, "USER_NOT_FOUND", "User not found")
    }

    return successResponse(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
        emailVerified: user.emailVerified,
        customerDetails: user.customerDetails,
        createdAt: user.createdAt?.toISOString(),
      },
      "Profile retrieved successfully",
      200,
    )
  } catch (error) {
    console.error("[v0] Get profile error:", error)
    return errorResponse(500, "INTERNAL_ERROR", "Failed to fetch profile")
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(401, "UNAUTHORIZED", "No token provided")
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload || (payload as any).type !== "access") {
      return errorResponse(401, "INVALID_TOKEN", "Invalid or expired token")
    }

    const body = await request.json()
    const { name, phone, customerDetails } = body

    if (name && typeof name !== "string") {
      return errorResponse(400, "VALIDATION_ERROR", "Name must be a string")
    }

    if (phone && typeof phone !== "string") {
      return errorResponse(400, "VALIDATION_ERROR", "Phone must be a string")
    }

    await connectToDatabase()
    const user = await User.findById((payload as any).userId)

    if (!user) {
      return errorResponse(404, "USER_NOT_FOUND", "User not found")
    }

    // Update user fields
    if (name) user.name = name
    if (phone) {
      user.customerDetails = user.customerDetails || {}
      user.customerDetails.phone = phone
    }
    if (customerDetails && typeof customerDetails === "object") {
      user.customerDetails = { ...user.customerDetails, ...customerDetails }
    }

    await user.save()

    return successResponse(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
        customerDetails: user.customerDetails,
      },
      "Profile updated successfully",
      200,
    )
  } catch (error) {
    console.error("[v0] Update profile error:", error)
    return errorResponse(500, "INTERNAL_ERROR", "Failed to update profile")
  }
}
