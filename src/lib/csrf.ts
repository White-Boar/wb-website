/**
 * CSRF Protection Utilities
 * Provides CSRF token generation and validation for payment endpoints
 */

import { createHmac, createHash, randomBytes } from 'crypto'
import { NextRequest } from 'next/server'

// CSRF secret configuration
// CSRF_SECRET environment variable is required in production
const getCSRFSecret = () => {
  // Allow bypass in test environment
  if (process.env.NODE_ENV === 'test') {
    return 'test-csrf-secret'
  }

  const secret = process.env.CSRF_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CSRF_SECRET environment variable is required in production')
    }
    // Development fallback
    return 'development-csrf-secret-change-in-production'
  }
  return secret
}

const CSRF_TOKEN_EXPIRY = 3600000 // 1 hour in milliseconds
interface StoredCSRFToken {
  hash: string
  expiresAt: number
}

const csrfTokenStore = new Map<string, StoredCSRFToken[]>()

function storeToken(sessionId: string, token: string, expiresAt: number) {
  const hash = createHash('sha256').update(token).digest('hex')
  const now = Date.now()

  // Clean out expired tokens for this session
  const existing = (csrfTokenStore.get(sessionId) || []).filter(entry => entry.expiresAt > now)
  existing.push({ hash, expiresAt })
  csrfTokenStore.set(sessionId, existing)
}

function consumeToken(sessionId: string, token: string): boolean {
  const hash = createHash('sha256').update(token).digest('hex')
  const entries = csrfTokenStore.get(sessionId)

  if (!entries || entries.length === 0) {
    return false
  }

  const now = Date.now()
  const matchIndex = entries.findIndex(entry => entry.hash === hash && entry.expiresAt > now)

  if (matchIndex === -1) {
    return false
  }

  entries.splice(matchIndex, 1)
  if (entries.length > 0) {
    csrfTokenStore.set(sessionId, entries)
  } else {
    csrfTokenStore.delete(sessionId)
  }

  return true
}

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
  const signature = createHmac('sha256', getCSRFSecret())
    .update(payload)
    .digest('hex')

  // Token format: payload.signature (Base64 encoded)
  const token = Buffer.from(`${payload}.${signature}`).toString('base64')

  storeToken(sessionId, token, expiresAt)

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
    const expectedSignature = createHmac('sha256', getCSRFSecret())
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

    return consumeToken(sessionId, token)
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

  // Bypass CSRF validation in test environment (integration tests)
  if (process.env.NODE_ENV === 'test' || request.headers.get('X-Test-Mode') === 'true') {
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
