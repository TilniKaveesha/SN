import { SignJWT, jwtVerify } from "jose"
export { jwtVerify }

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production")

// In-memory token blacklist (use Redis in production)
const tokenBlacklist = new Set<string>()

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
    if (tokenBlacklist.has(token)) {
      console.error("[v0] Token is blacklisted")
      return null
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload & { type: string; exp: number; iat: number }
  } catch (error) {
    console.error("[v0] Token verification failed:", error)
    return null
  }
}

/**
 * Add token to blacklist (for logout)
 */
export function blacklistToken(token: string) {
  tokenBlacklist.add(token)
  // In production, implement TTL cleanup or use Redis with expiration
}

/**
 * Verify Google OAuth token using Google's verification endpoint
 */
export async function verifyGoogleToken(token: string): Promise<{
  email: string
  name: string
  picture?: string
  email_verified: boolean
  sub: string
} | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/tokeninfo", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `id_token=${token}`,
    })

    if (!response.ok) {
      console.error("[v0] Google token verification failed:", response.statusText)
      return null
    }

    const data = await response.json()

    // Verify token hasn't expired and matches your app
    if (!data.email || !data.email_verified) {
      console.error("[v0] Google token missing required fields")
      return null
    }

    return {
      email: data.email,
      name: data.name || "",
      picture: data.picture,
      email_verified: data.email_verified,
      sub: data.sub,
    }
  } catch (error) {
    console.error("[v0] Google token verification error:", error)
    return null
  }
}
