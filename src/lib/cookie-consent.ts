/**
 * Cookie Consent Management
 * Handles storing and retrieving user cookie preferences
 */

export type CookieCategory = 'essential' | 'analytics' | 'marketing';

export interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const COOKIE_CONSENT_KEY = 'wb_cookie_consent';

/**
 * Get current cookie consent from localStorage
 */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return {
      essential: parsed.essential ?? true,
      analytics: parsed.analytics ?? false,
      marketing: parsed.marketing ?? false,
      timestamp: parsed.timestamp ?? Date.now(),
    };
  } catch (error) {
    console.error('Failed to parse cookie consent:', error);
    return null;
  }
}

/**
 * Save cookie consent to localStorage
 */
export function setCookieConsent(consent: Omit<CookieConsent, 'timestamp'>): void {
  if (typeof window === 'undefined') return;

  const consentWithTimestamp: CookieConsent = {
    ...consent,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentWithTimestamp));

    // Trigger consent change event for scripts to listen to
    window.dispatchEvent(new CustomEvent('cookieConsentChange', {
      detail: consentWithTimestamp
    }));
  } catch (error) {
    console.error('Failed to save cookie consent:', error);
  }
}

/**
 * Check if user has given consent
 */
export function hasGivenConsent(): boolean {
  return getCookieConsent() !== null;
}

/**
 * Check if a specific category is allowed
 */
export function isCategoryAllowed(category: CookieCategory): boolean {
  const consent = getCookieConsent();
  if (!consent) return false;
  return consent[category] ?? false;
}

/**
 * Accept all cookies
 */
export function acceptAllCookies(): void {
  setCookieConsent({
    essential: true,
    analytics: true,
    marketing: true,
  });
}

/**
 * Accept only essential cookies
 */
export function acceptEssentialOnly(): void {
  setCookieConsent({
    essential: true,
    analytics: false,
    marketing: false,
  });
}

/**
 * Clear cookie consent (for testing or reset)
 */
export function clearCookieConsent(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(COOKIE_CONSENT_KEY);
}
