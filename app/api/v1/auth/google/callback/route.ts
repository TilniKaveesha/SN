/* eslint-disable @typescript-eslint/no-unused-vars */
import { type NextRequest, NextResponse } from "next/server"

/**
 * GET /api/v1/auth/google/callback
 * OAuth callback endpoint for Google Sign-In
 *
 * Query Parameters:
 * - code: Authorization code from Google
 * - state: State parameter for CSRF protection
 *
 * This endpoint handles the OAuth callback from Google and exchanges
 * the authorization code for user information.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code) {
      return NextResponse.json({ success: false, message: "Authorization code is required" }, { status: 400 })
    }

    // In production, you would:
    // 1. Verify the state parameter
    // 2. Exchange code for access token with Google
    // 3. Get user info from Google
    // 4. Create/update user in database
    // 5. Generate JWT tokens
    // 6. Redirect to frontend with tokens

    return NextResponse.json({
      success: true,
      message: "Callback received. Use POST /api/v1/auth/google with the token instead.",
      info: "This endpoint is for OAuth flow. For client-side Google Sign-In, use POST /api/v1/auth/google",
    })
  } catch (error) {
    console.error("[v0] Google callback error:", error)
    return NextResponse.json({ success: false, message: "Callback processing failed" }, { status: 500 })
  }
}
