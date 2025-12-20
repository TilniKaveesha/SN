import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/db"
import User from "@/lib/db/models/user.model"
import { generateTokens } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone } = await request.json()

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json({ success: false, message: "Email, password, and name are required" }, { status: 400 })
    }

    await connectToDatabase()

    // Check if user already exists
    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return NextResponse.json({ success: false, message: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      role: "user",
      customerDetails: phone ? { phone } : undefined,
    })

    // Generate JWT tokens
    const { accessToken, refreshToken } = await generateTokens({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
    })

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          name: newUser.name,
          phone: newUser.customerDetails?.phone || null,
          role: newUser.role,
          createdAt: newUser.createdAt.toISOString(),
        },
        token: accessToken,
        refreshToken: refreshToken,
      },
    })
  } catch (error) {
    console.error("[v0] Signup error:", error)
    return NextResponse.json({ success: false, message: "Registration failed" }, { status: 500 })
  }
}
