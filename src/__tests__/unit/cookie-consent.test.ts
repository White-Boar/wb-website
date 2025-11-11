import {
  getCookieConsent,
  setCookieConsent,
  hasGivenConsent,
  isCategoryAllowed,
  acceptAllCookies,
  acceptEssentialOnly,
  type CookieConsent,
} from '@/lib/cookie-consent'

const COOKIE_CONSENT_KEY = 'wb_cookie_consent'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock window.dispatchEvent
const mockDispatchEvent = jest.fn()
window.dispatchEvent = mockDispatchEvent

describe('cookie-consent', () => {
  beforeEach(() => {
    localStorageMock.clear()
    mockDispatchEvent.mockClear()
  })

  describe('getCookieConsent', () => {
    it('should return null when no consent exists', () => {
      expect(getCookieConsent()).toBeNull()
    })

    it('should return consent object when it exists', () => {
      const consent: CookieConsent = {
        essential: true,
        analytics: true,
        marketing: false,
        timestamp: Date.now(),
      }
      localStorageMock.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))

      const result = getCookieConsent()
      expect(result).toEqual(consent)
    })

    it('should return null when stored data is invalid JSON', () => {
      localStorageMock.setItem(COOKIE_CONSENT_KEY, 'invalid-json')
      expect(getCookieConsent()).toBeNull()
    })
  })

  describe('setCookieConsent', () => {
    it('should save consent to localStorage with timestamp', () => {
      const consent = {
        essential: true,
        analytics: true,
        marketing: false,
      }

      setCookieConsent(consent)

      const stored = localStorageMock.getItem(COOKIE_CONSENT_KEY)
      expect(stored).toBeTruthy()

      const parsed = JSON.parse(stored!)
      expect(parsed.essential).toBe(true)
      expect(parsed.analytics).toBe(true)
      expect(parsed.marketing).toBe(false)
      expect(parsed.timestamp).toBeDefined()
      expect(typeof parsed.timestamp).toBe('number')
    })

    it('should dispatch cookieConsentChange event', () => {
      const consent = {
        essential: true,
        analytics: false,
        marketing: false,
      }

      setCookieConsent(consent)

      expect(mockDispatchEvent).toHaveBeenCalledTimes(1)
      const event = mockDispatchEvent.mock.calls[0][0]
      expect(event.type).toBe('cookieConsentChange')
      expect(event.detail.essential).toBe(true)
      expect(event.detail.analytics).toBe(false)
      expect(event.detail.marketing).toBe(false)
    })
  })

  describe('hasGivenConsent', () => {
    it('should return false when no consent exists', () => {
      expect(hasGivenConsent()).toBe(false)
    })

    it('should return true when consent exists', () => {
      const consent: CookieConsent = {
        essential: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now(),
      }
      localStorageMock.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))

      expect(hasGivenConsent()).toBe(true)
    })

    it('should return false when stored data is invalid', () => {
      localStorageMock.setItem(COOKIE_CONSENT_KEY, 'invalid')
      expect(hasGivenConsent()).toBe(false)
    })
  })

  describe('isCategoryAllowed', () => {
    it('should return false when no consent exists', () => {
      expect(isCategoryAllowed('analytics')).toBe(false)
    })

    it('should return true for enabled category', () => {
      const consent: CookieConsent = {
        essential: true,
        analytics: true,
        marketing: false,
        timestamp: Date.now(),
      }
      localStorageMock.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))

      expect(isCategoryAllowed('analytics')).toBe(true)
    })

    it('should return false for disabled category', () => {
      const consent: CookieConsent = {
        essential: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now(),
      }
      localStorageMock.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))

      expect(isCategoryAllowed('marketing')).toBe(false)
    })

    it('should always return true for essential cookies', () => {
      const consent: CookieConsent = {
        essential: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now(),
      }
      localStorageMock.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))

      expect(isCategoryAllowed('essential')).toBe(true)
    })
  })

  describe('acceptAllCookies', () => {
    it('should set all categories to true', () => {
      acceptAllCookies()

      const stored = localStorageMock.getItem(COOKIE_CONSENT_KEY)
      const parsed = JSON.parse(stored!)

      expect(parsed.essential).toBe(true)
      expect(parsed.analytics).toBe(true)
      expect(parsed.marketing).toBe(true)
    })

    it('should dispatch cookieConsentChange event', () => {
      acceptAllCookies()
      expect(mockDispatchEvent).toHaveBeenCalledTimes(1)
    })
  })

  describe('acceptEssentialOnly', () => {
    it('should only set essential to true', () => {
      acceptEssentialOnly()

      const stored = localStorageMock.getItem(COOKIE_CONSENT_KEY)
      const parsed = JSON.parse(stored!)

      expect(parsed.essential).toBe(true)
      expect(parsed.analytics).toBe(false)
      expect(parsed.marketing).toBe(false)
    })

    it('should dispatch cookieConsentChange event', () => {
      acceptEssentialOnly()
      expect(mockDispatchEvent).toHaveBeenCalledTimes(1)
    })
  })
})
