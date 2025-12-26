/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Input validation utilities with sanitization
 */

export interface ValidationError {
  field: string
  message: string
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateRequired(value: any, fieldName: string): ValidationError | null {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return { field: fieldName, message: `${fieldName} is required` }
  }
  return null
}

export function validateNumber(value: any, fieldName: string, min = 0): ValidationError | null {
  const num = Number(value)
  if (isNaN(num) || num < min) {
    return { field: fieldName, message: `${fieldName} must be a valid number >= ${min}` }
  }
  return null
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, "").slice(0, 255)
}

export function validatePagination(page?: string, limit?: string): { page: number; limit: number } | ValidationError {
  const pageNum = Number(page || "1")
  const limitNum = Number(limit || "10")

  if (isNaN(pageNum) || pageNum < 1) {
    return { field: "page", message: "Page must be a positive number" }
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return { field: "limit", message: "Limit must be between 1 and 100" }
  }

  return { page: pageNum, limit: limitNum }
}

export function validateObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

export function validateProductUpdate(data: any): ValidationError | null {
  const errors: ValidationError[] = []

  if (data.name && data.name.trim().length === 0) {
    errors.push({ field: "name", message: "Product name cannot be empty" })
  }

  if (data.price && (isNaN(data.price) || data.price < 0)) {
    errors.push({ field: "price", message: "Product price must be a positive number" })
  }

  if (data.stock && (isNaN(data.stock) || data.stock < 0)) {
    errors.push({ field: "stock", message: "Product stock must be a positive number" })
  }

  if (data.category && data.category.trim().length === 0) {
    errors.push({ field: "category", message: "Product category cannot be empty" })
  }

  return errors.length > 0 ? errors[0] : null
}
