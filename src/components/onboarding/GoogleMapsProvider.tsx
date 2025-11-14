'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'

interface GoogleMapsProviderProps {
  children: React.ReactNode
}

/**
 * Google Maps Provider
 *
 * Loads Google Maps API in the background for address autocomplete
 * Silently fails if API key is not configured or loading fails
 * The AddressAutocomplete component will fallback to manual entry
 */
export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const locale = useLocale()
  const { isLoaded, error } = useGoogleMaps({ language: locale })

  useEffect(() => {
    if (error) {
      // Silently log the error - the UI will fallback to manual entry
      console.info('Google Maps not available, using manual address entry')
    }
  }, [error])

  // Don't block rendering - just load the API in the background
  return <>{children}</>
}
