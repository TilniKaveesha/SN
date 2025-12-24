import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, blacklistToken } from "@/lib/jwt"

// In production, maintain a token blacklist in Redis or database
// const tokenBlacklist = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized - No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 })
    }

    blacklistToken(token)

    return NextResponse.json({
      success: true,
      message: "Logout successful",
    })
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json({ success: false, message: "Logout failed" }, { status: 500 })
  }
}

// Helper function to check if token is blacklisted
// export function isTokenBlacklisted(token: string): boolean {
//   return tokenBlacklist.has(token)
// }
