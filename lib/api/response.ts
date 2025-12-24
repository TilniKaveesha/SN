/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Standard API response utilities for consistent response formatting
 */

import { NextResponse } from "next/server"

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: {
    code: string
    details?: any
  }
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  timestamp: string
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function successResponse<T>(
  data: T,
  message?: string,
  statusCode = 200,
  pagination?: ApiResponse["pagination"],
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  }

  if (pagination) {
    response.pagination = pagination
  }

  return NextResponse.json(response, { status: statusCode })
}

export function errorResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: any,
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        details,
      },
      message,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode },
  )
}

export function handleApiError(error: any): NextResponse<ApiResponse> {
  console.error("[API Error]", error)

  if (error instanceof ApiError) {
    return errorResponse(error.statusCode, error.code, error.message, error.details)
  }

  return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred", {
    message: error?.message,
  })
}
