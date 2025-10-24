/**
 * Retry utility for critical API calls with exponential backoff
 * Provides resilient error handling for onboarding operations
 */

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts: number
  /** Initial delay in milliseconds */
  initialDelay: number
  /** Maximum delay in milliseconds */
  maxDelay: number
  /** Multiplier for exponential backoff */
  backoffMultiplier: number
  /** Whether to add jitter to prevent thundering herd */
  jitter: boolean
  /** Function to determine if error should trigger retry */
  shouldRetry?: (error: any) => boolean
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalTime: number
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
  shouldRetry: (error) => {
    // Retry on network errors, 5xx errors, and timeouts
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true // Network error
    }
    if (error.status >= 500 && error.status < 600) {
      return true // Server error
    }
    if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      return true // Timeout
    }
    return false
  }
}

/**
 * Executes a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  const startTime = Date.now()
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await operation()
      return {
        success: true,
        data: result,
        attempts: attempt,
        totalTime: Date.now() - startTime
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on the last attempt or if error shouldn't trigger retry
      if (attempt === config.maxAttempts || !config.shouldRetry?.(error)) {
        break
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      )

      // Add jitter to prevent thundering herd
      if (config.jitter) {
        delay = delay * (0.5 + Math.random() * 0.5)
      }

      console.warn(`Attempt ${attempt} failed, retrying in ${Math.round(delay)}ms:`, error)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return {
    success: false,
    error: lastError || new Error('Unknown error'),
    attempts: config.maxAttempts,
    totalTime: Date.now() - startTime
  }
}

/**
 * Specific retry configurations for different operation types
 */
export const RETRY_CONFIGS = {
  /** Critical operations like session creation and final submission */
  critical: {
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 15000,
    backoffMultiplier: 2,
    jitter: true
  },

  /** Standard operations like auto-save and validation */
  standard: {
    maxAttempts: 3,
    initialDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 2,
    jitter: true
  },

  /** Quick operations like field validation */
  fast: {
    maxAttempts: 2,
    initialDelay: 200,
    maxDelay: 1000,
    backoffMultiplier: 2,
    jitter: false
  },

  /** File upload operations with longer timeouts */
  fileUpload: {
    maxAttempts: 3,
    initialDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    shouldRetry: (error: any) => {
      // Don't retry client errors (4xx) for file uploads
      if (error.status >= 400 && error.status < 500) {
        return false
      }
      return DEFAULT_RETRY_OPTIONS.shouldRetry?.(error) ?? false
    }
  }
} as const

/**
 * Convenience functions for common retry patterns
 */
export const retry = {
  /** For critical operations like session creation and submission */
  critical: <T>(operation: () => Promise<T>) =>
    withRetry(operation, RETRY_CONFIGS.critical),

  /** For standard operations like auto-save */
  standard: <T>(operation: () => Promise<T>) =>
    withRetry(operation, RETRY_CONFIGS.standard),

  /** For quick operations like validation */
  fast: <T>(operation: () => Promise<T>) =>
    withRetry(operation, RETRY_CONFIGS.fast),

  /** For file upload operations */
  fileUpload: <T>(operation: () => Promise<T>) =>
    withRetry(operation, RETRY_CONFIGS.fileUpload)
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime: number | null = null
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeMs: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failureCount = 0
    this.state = 'CLOSED'
  }

  private onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN'
    }
  }

  private shouldAttemptReset(): boolean {
    return this.lastFailureTime !== null &&
           Date.now() - this.lastFailureTime >= this.recoveryTimeMs
  }
}

/**
 * Global circuit breakers for different service endpoints
 */
export const circuitBreakers = {
  sessionService: new CircuitBreaker(5, 60000),
  submissionService: new CircuitBreaker(3, 120000),
  fileUploadService: new CircuitBreaker(5, 30000),
  emailService: new CircuitBreaker(3, 180000)
}