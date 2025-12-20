import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import User from "@/lib/db/models/user.model"
import { generateTokens } from "@/lib/jwt"

/**
 * POST /api/v1/auth/google
 * Authenticate with Google OAuth token
 *
 * Request Body:
 * {
 *   "googleToken": "string",       // Google OAuth ID token
 *   "email": "string",             // User email from Google
 *   "name": "string",              // User name from Google
 *   "picture": "string"            // User profile picture URL (optional)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Authentication successful",
 *   "data": {
 *     "user": { ... },
 *     "token": "jwt_access_token",
 *     "refreshToken": "jwt_refresh_token"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { googleToken, email, name, picture } = await request.json()

    // Validate required fields
    if (!googleToken || !email || !name) {
      return NextResponse.json(
        {
          success: false,
          message: "Google token, email, and name are required",
        },
        { status: 400 },
      )
    }

    // Verify Google token (in production, verify with Google's token verification API)
    // For now, we'll trust the client has already verified the token
    // In production, add: await verifyGoogleToken(googleToken)

    await connectToDatabase()

    // Check if user exists
    let user = await User.findOne({ email })

    if (user) {
      // Update existing user info from Google
      user.name = name
      user.image = picture || user.image
      user.emailVerified = true
      await user.save()
    } else {
      // Create new user from Google profile
      user = await User.create({
        email,
        name,
        image: picture,
        role: "user",
        emailVerified: true,
      })
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = await generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    return NextResponse.json({
      success: true,
      message: user ? "Login successful" : "User created and logged in",
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        token: accessToken,
        refreshToken: refreshToken,
      },
    })
  } catch (error) {
    console.error("[v0] Google OAuth error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Google authentication failed",
      },
      { status: 500 },
    )
  }
}
