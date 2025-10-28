import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { CheckoutSessionService } from '@/services/payment/CheckoutSessionService'
import { StripePaymentService } from '@/services/payment/StripePaymentService'
import { SupabaseClient } from '@supabase/supabase-js'

// Mock dependencies
jest.mock('@/services/payment/StripePaymentService')

describe('CheckoutSessionService', () => {
  let service: CheckoutSessionService
  let mockStripeService: jest.Mocked<StripePaymentService>
  let mockSupabase: jest.Mocked<SupabaseClient>

  beforeEach(() => {
    // Create mock StripePaymentService
    mockStripeService = {
      findOrCreateCustomer: jest.fn(),
      validateCoupon: jest.fn(),
      createSubscriptionSchedule: jest.fn(),
      retrieveSubscription: jest.fn(),
      createCheckoutSession: jest.fn()
    } as any

    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      gte: jest.fn().mockReturnThis()
    } as any

    // Create service with mocked dependencies
    service = new CheckoutSessionService(mockStripeService as any)
  })

  describe('validateSubmission', () => {
    it('should return valid submission when found', async () => {
      const submission = {
        id: 'sub_123',
        session_id: 'session_123',
        status: 'pending',
        form_data: { email: 'test@example.com' }
      }

      mockSupabase.single.mockResolvedValue({
        data: submission,
        error: null
      } as any)

      const result = await service.validateSubmission('sub_123', mockSupabase)

      expect(result.valid).toBe(true)
      expect(result.submission).toEqual(submission)
    })

    it('should return invalid when submission not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      } as any)

      const result = await service.validateSubmission('sub_invalid', mockSupabase)

      expect(result.valid).toBe(false)
      expect(result.error?.code).toBe('INVALID_SUBMISSION_ID')
    })

    it('should return valid with existingSubscription flag when submission already has subscription', async () => {
      const submission = {
        id: 'sub_123',
        stripe_subscription_id: 'sub_stripe_123',
        form_data: {}
      }

      mockSupabase.single.mockResolvedValue({
        data: submission,
        error: null
      } as any)

      const result = await service.validateSubmission('sub_123', mockSupabase)

      expect(result.valid).toBe(true)
      expect(result.existingSubscription).toBe(true)
      expect(result.submission).toEqual(submission)
    })
  })

  describe('validateLanguageCodes', () => {
    it('should return empty array for valid language codes', () => {
      const result = service.validateLanguageCodes(['fr', 'de', 'es'])
      expect(result).toEqual([])
    })

    it('should return invalid language codes', () => {
      const result = service.validateLanguageCodes(['fr', 'invalid', 'de', 'xxx'])
      expect(result).toEqual(['invalid', 'xxx'])
    })

    it('should return all codes when all invalid', () => {
      const result = service.validateLanguageCodes(['invalid', 'xxx', ''])
      expect(result).toEqual(['invalid', 'xxx', ''])
    })

    it('should handle empty input', () => {
      const result = service.validateLanguageCodes([])
      expect(result).toEqual([])
    })
  })

  describe('checkRateLimit', () => {
    it('should allow request when under limit', async () => {
      mockSupabase.select.mockReturnThis()
      mockSupabase.eq.mockReturnThis()
      mockSupabase.gte.mockReturnThis()
      ;(mockSupabase as any).count = 3

      const result = await service.checkRateLimit('session_123', mockSupabase)

      expect(result.allowed).toBe(true)
      expect(result.attemptsRemaining).toBe(2)
    })

    it('should block request when at limit', async () => {
      mockSupabase.select.mockReturnThis()
      mockSupabase.eq.mockReturnThis()
      mockSupabase.gte.mockReturnThis()
      ;(mockSupabase as any).count = 5

      const result = await service.checkRateLimit('session_123', mockSupabase)

      expect(result.allowed).toBe(false)
      expect(result.attemptsRemaining).toBe(0)
    })

    it('should allow request for new session with no attempts', async () => {
      mockSupabase.select.mockReturnThis()
      mockSupabase.eq.mockReturnThis()
      mockSupabase.gte.mockReturnThis()
      ;(mockSupabase as any).count = 0

      const result = await service.checkRateLimit('session_new', mockSupabase)

      expect(result.allowed).toBe(true)
      expect(result.attemptsRemaining).toBe(5)
    })
  })

  describe('extractCustomerInfo', () => {
    it('should extract email from form_data.email', () => {
      const submission = {
        form_data: {
          email: 'test@example.com',
          businessName: 'Test Business'
        }
      }

      const result = service.extractCustomerInfo(submission)

      expect(result).toEqual({
        email: 'test@example.com',
        businessName: 'Test Business'
      })
    })

    it('should extract email from form_data.step3.businessEmail', () => {
      const submission = {
        form_data: {
          step3: {
            businessEmail: 'business@example.com',
            businessName: 'Business Name'
          }
        }
      }

      const result = service.extractCustomerInfo(submission)

      expect(result).toEqual({
        email: 'business@example.com',
        businessName: 'Business Name'
      })
    })

    it('should fallback to Unknown Business when name missing', () => {
      const submission = {
        form_data: {
          email: 'test@example.com'
        }
      }

      const result = service.extractCustomerInfo(submission)

      expect(result.businessName).toBe('Unknown Business')
    })

    it('should throw error when email not found', () => {
      const submission = {
        form_data: {}
      }

      expect(() => service.extractCustomerInfo(submission)).toThrow(
        'MISSING_CUSTOMER_EMAIL'
      )
    })
  })
})
