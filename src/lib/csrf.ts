/**
 * CSRF Protection Utilities
 * Provides CSRF token generation and validation for payment endpoints
 */

import { createHmac, randomBytes } from 'crypto'
import { NextRequest } from 'next/server'

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production'
const CSRF_TOKEN_EXPIRY = 3600000 // 1 hour in milliseconds

export interface CSRFToken {
  token: string
  expiresAt: number
}

/**
 * Generate a CSRF token for the current session
 */
export function generateCSRFToken(sessionId: string): CSRFToken {
  const timestamp = Date.now()
  const expiresAt = timestamp + CSRF_TOKEN_EXPIRY
  const nonce = randomBytes(16).toString('hex')

  // Create token payload: sessionId|timestamp|nonce
  const payload = `${sessionId}|${timestamp}|${nonce}`

  // Sign the payload with HMAC
  const signature = createHmac('sha256', CSRF_SECRET)
    .update(payload)
    .digest('hex')

  // Token format: payload.signature (Base64 encoded)
  const token = Buffer.from(`${payload}.${signature}`).toString('base64')

  return {
    token,
    expiresAt
  }
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string, sessionId: string): boolean {
  try {
    // Decode the token
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [payload, signature] = decoded.split('.')

    if (!payload || !signature) {
      return false
    }

    // Verify signature
    const expectedSignature = createHmac('sha256', CSRF_SECRET)
      .update(payload)
      .digest('hex')

    if (signature !== expectedSignature) {
      return false
    }

    // Parse payload
    const [tokenSessionId, timestamp, nonce] = payload.split('|')

    // Validate session ID matches
    if (tokenSessionId !== sessionId) {
      return false
    }

    // Validate token has not expired
    const tokenTimestamp = parseInt(timestamp, 10)
    if (Date.now() > tokenTimestamp + CSRF_TOKEN_EXPIRY) {
      return false
    }

    return true
  } catch (error) {
    console.error('CSRF token validation error:', error)
    return false
  }
}

/**
 * Extract CSRF token from request headers
 */
export function getCSRFTokenFromRequest(request: NextRequest): string | null {
  // Check X-CSRF-Token header
  const headerToken = request.headers.get('X-CSRF-Token')
  if (headerToken) {
    return headerToken
  }

  // Fallback to query parameter (less secure, only for GET requests)
  if (request.method === 'GET') {
    const url = new URL(request.url)
    return url.searchParams.get('csrf_token')
  }

  return null
}

/**
 * Middleware function to validate CSRF token on payment endpoints
 * Use this in API routes that handle payment operations
 */
export function requireCSRFToken(
  request: NextRequest,
  sessionId: string
): { valid: boolean; error?: string } {
  // Webhook requests from Stripe are exempt (they use signature verification instead)
  if (request.url.includes('/api/stripe/webhook')) {
    return { valid: true }
  }

  // GET requests are exempt from CSRF (they should not perform state changes)
  if (request.method === 'GET') {
    return { valid: true }
  }

  const token = getCSRFTokenFromRequest(request)

  if (!token) {
    return {
      valid: false,
      error: 'CSRF token missing. Include X-CSRF-Token header.'
    }
  }

  const isValid = validateCSRFToken(token, sessionId)

  if (!isValid) {
    return {
      valid: false,
      error: 'Invalid or expired CSRF token. Please refresh and try again.'
    }
  }

  return { valid: true }
}

/**
 * Rate limiting for payment endpoints
 * Tracks attempts per session ID and enforces limits
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 3600000 // 1 hour
const MAX_PAYMENT_ATTEMPTS = 5

export function checkRateLimit(sessionId: string): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const record = rateLimitStore.get(sessionId)

  // Clean up expired records periodically
  if (Math.random() < 0.01) { // 1% chance to trigger cleanup
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetAt) {
        rateLimitStore.delete(key)
      }
    }
  }

  // No record or expired - allow and create new record
  if (!record || now > record.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW
    rateLimitStore.set(sessionId, { count: 1, resetAt })
    return {
      allowed: true,
      remaining: MAX_PAYMENT_ATTEMPTS - 1,
      resetAt
    }
  }

  // Check if limit exceeded
  if (record.count >= MAX_PAYMENT_ATTEMPTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt
    }
  }

  // Increment count and allow
  record.count++
  rateLimitStore.set(sessionId, record)

  return {
    allowed: true,
    remaining: MAX_PAYMENT_ATTEMPTS - record.count,
    resetAt: record.resetAt
  }
}
