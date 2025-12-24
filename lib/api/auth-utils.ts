 
/**
 * API authentication utilities for JWT token verification
 */

import { ApiError } from "./response"
import { verifyToken } from "@/lib/jwt"

export interface AuthPayload {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

/**
 * Verifies Authorization header and returns decoded JWT payload
 */
export async function verifyApiAuth(authHeader?: string): Promise<AuthPayload> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(
      401,
      "UNAUTHORIZED",
      "Missing or invalid authorization header"
    )
  }

  const token = authHeader.slice(7)

  const payload = await verifyToken(token)

  if (!payload) {
    throw new ApiError(
      401,
      "INVALID_TOKEN",
      "Invalid, expired, or revoked token"
    )
  }

  return payload as AuthPayload
}

/**
 * Ensures the authenticated user is an admin
 */
export function requireAdmin(user: AuthPayload): void {
  if (user.role !== "admin") {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Admin access required"
    )
  }
}
