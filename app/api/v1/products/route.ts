/* eslint-disable @typescript-eslint/no-unused-vars */
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    // TODO: Fetch products from database with pagination and filters

    return NextResponse.json({
      success: true,
      data: {
        products: [
          {
            id: "prod_123",
            name: "Sample Product",
            description: "Product description",
            price: 29.99,
            category: "Electronics",
            image: "/images/product.jpg",
            stock: 100,
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        pagination: {
          page,
          limit,
          total: 100,
          totalPages: 10,
        },
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { name, description, price, category, image, stock } = await request.json()

    // Validate required fields
    if (!name || !price || !category) {
      return NextResponse.json({ success: false, message: "Name, price, and category are required" }, { status: 400 })
    }

    // TODO: Verify user is admin
    // TODO: Create product in database

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        data: {
          id: "prod_new_123",
          name,
          description,
          price,
          category,
          image,
          stock: stock || 0,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to create product" }, { status: 500 })
  }
}
