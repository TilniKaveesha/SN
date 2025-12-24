import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, generateTokens } from "@/lib/jwt"
import { connectToDatabase } from "@/lib/db"
import User from "@/lib/db/models/user.model"

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json({ success: false, message: "Refresh token is required" }, { status: 400 })
    }

    const payload = await verifyToken(refreshToken)

    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid or expired refresh token" }, { status: 401 })
    }

    if (payload.type !== "refresh") {
      return NextResponse.json({ success: false, message: "Token is not a refresh token" }, { status: 401 })
    }

    // Verify user still exists
    await connectToDatabase()
    const user = await User.findById(payload.userId)

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const tokens = await generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Token refreshed successfully",
        data: {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: 900, // 15 minutes in seconds
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Token refresh error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
