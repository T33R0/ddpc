import { NextResponse } from 'next/server'

/**
 * Standardized API response helpers.
 *
 * Usage:
 *   return apiError('Unauthorized', 401)
 *   return apiSuccess({ vehicles: data })
 *   return apiSuccess({ id: '123' }, 201)
 */

export function apiError(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { error: message, ...(details !== undefined && { details }) },
    { status }
  )
}

export function apiSuccess(data: object, status = 200) {
  return NextResponse.json(data, { status })
}

// Common error shortcuts
export const unauthorized = (message = 'Unauthorized') => apiError(message, 401)
export const forbidden = (message = 'Forbidden') => apiError(message, 403)
export const notFound = (message = 'Not found') => apiError(message, 404)
export const badRequest = (message: string) => apiError(message, 400)
export const serverError = (message = 'Internal server error') => apiError(message, 500)
