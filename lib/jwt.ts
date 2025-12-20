import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "your-secret-key-change-in-production")

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

/**
 * Generate access and refresh tokens
 */
export async function generateTokens(payload: JWTPayload) {
  // Access token expires in 15 minutes
  const accessToken = await new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .setIssuedAt()
    .sign(JWT_SECRET)

  // Refresh token expires in 7 days
  const refreshToken = await new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET)

  return { accessToken, refreshToken }
}

/**
 * Verify JWT token
 */
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload & { type: string; exp: number; iat: number }
  } catch (error) {
    console.error("[v0] Token verification failed:", error)
    return null
  }
}

/**
 * Verify Google OAuth token
 * In production, implement actual Google token verification
 */
export async function verifyGoogleToken(token: string): Promise<{
  email: string
  name: string
  picture?: string
  email_verified: boolean
} | null> {
  try {
    // In production, use Google's token verification endpoint:
    // https://oauth2.googleapis.com/tokeninfo?id_token={token}
    // or use google-auth-library package

    // For now, return null to indicate this needs implementation
    console.log("[v0] Google token verification not implemented:", token.substring(0, 20))
    return null
  } catch (error) {
    console.error("[v0] Google token verification error:", error)
    return null
  }
}
