import { useState, useEffect } from 'react'

export interface PricingData {
  basePackage: {
    priceId: string
    amount: number // in cents
    currency: string
    interval: string
  }
  languageAddOn: {
    priceId: string
    amount: number // in cents
    currency: string
  }
}

export interface UsePricingResult {
  prices: PricingData | null
  isLoading: boolean
  error: Error | null
  // Formatted helper values
  basePackagePrice: string // e.g., "€35"
  basePackagePricePerMonth: string // e.g., "€35 / month"
  languageAddOnPrice: string // e.g., "€75"
}

// In-memory cache shared across all hook instances
let cachedPrices: PricingData | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes (matches server cache)

/**
 * Hook to fetch and cache Stripe pricing information
 *
 * Features:
 * - Fetches prices from /api/stripe/prices (which has server-side caching)
 * - Client-side in-memory cache with 10-minute TTL
 * - Automatic fallback to €35/month for base package, €75 for language add-on
 * - Formatted price strings for easy display
 *
 * @returns Pricing data, loading state, error, and formatted price strings
 */
export function usePricing(): UsePricingResult {
  const [prices, setPrices] = useState<PricingData | null>(cachedPrices)
  const [isLoading, setIsLoading] = useState(!cachedPrices)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchPrices() {
      // Check if cache is still valid
      if (cachedPrices && Date.now() - cacheTimestamp < CACHE_TTL) {
        setPrices(cachedPrices)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await fetch('/api/stripe/prices')

        if (!response.ok) {
          throw new Error(`Failed to fetch prices: ${response.status}`)
        }

        const result = await response.json()

        if (result.success && result.data) {
          cachedPrices = result.data
          cacheTimestamp = Date.now()
          setPrices(result.data)
          setError(null)
        } else {
          throw new Error(result.error?.message || 'Invalid response format')
        }
      } catch (err) {
        console.error('usePricing: Failed to fetch prices, using fallback:', err)

        // Set fallback prices on error
        const fallbackPrices: PricingData = {
          basePackage: {
            priceId: process.env.NEXT_PUBLIC_STRIPE_BASE_PACKAGE_PRICE_ID || '',
            amount: 3500, // €35.00 in cents
            currency: 'eur',
            interval: 'month'
          },
          languageAddOn: {
            priceId: process.env.NEXT_PUBLIC_STRIPE_LANGUAGE_ADDON_PRICE_ID || '',
            amount: 7500, // €75.00 in cents
            currency: 'eur'
          }
        }

        setPrices(fallbackPrices)
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrices()
  }, [])

  // Format prices for display
  const formatPrice = (amount: number, currency: string): string => {
    const euros = amount / 100
    const symbol = currency.toLowerCase() === 'eur' ? '€' : currency.toUpperCase()
    return `${symbol}${euros.toFixed(0)}`
  }

  const basePackagePrice = prices
    ? formatPrice(prices.basePackage.amount, prices.basePackage.currency)
    : '€35'

  const basePackagePricePerMonth = prices
    ? `${formatPrice(prices.basePackage.amount, prices.basePackage.currency)} / ${prices.basePackage.interval}`
    : '€35 / month'

  const languageAddOnPrice = prices
    ? formatPrice(prices.languageAddOn.amount, prices.languageAddOn.currency)
    : '€75'

  return {
    prices,
    isLoading,
    error,
    basePackagePrice,
    basePackagePricePerMonth,
    languageAddOnPrice
  }
}
