/* eslint-disable @typescript-eslint/no-unused-vars */
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone } = await request.json()

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json({ success: false, message: "Email, password, and name are required" }, { status: 400 })
    }

    // TODO: Hash password with bcrypt
    // TODO: Store user in database
    // TODO: Generate JWT token

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: "user_123",
          email,
          name,
          phone: phone || null,
          createdAt: new Date().toISOString(),
        },
        token: "jwt_access_token_here",
        refreshToken: "jwt_refresh_token_here",
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Registration failed" }, { status: 500 })
  }
}
