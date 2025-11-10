"use client"

import * as React from "react"
import Script from "next/script"
import { isCategoryAllowed } from "@/lib/cookie-consent"

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics() {
  const [hasConsent, setHasConsent] = React.useState(false)
  const [isInitialized, setIsInitialized] = React.useState(false)

  React.useEffect(() => {
    // Check initial consent status
    const checkConsent = () => {
      const analyticsAllowed = isCategoryAllowed('analytics')
      setHasConsent(analyticsAllowed)

      if (analyticsAllowed && !isInitialized) {
        setIsInitialized(true)
      } else if (!analyticsAllowed && isInitialized) {
        // Disable Google Analytics
        if (window.gtag) {
          window.gtag('consent', 'update', {
            'analytics_storage': 'denied'
          })
        }
      }
    }

    checkConsent()

    // Listen for consent changes
    const handleConsentChange = () => {
      checkConsent()
    }

    window.addEventListener('cookieConsentChange', handleConsentChange)

    return () => {
      window.removeEventListener('cookieConsentChange', handleConsentChange)
    }
  }, [isInitialized])

  // Only render GA scripts if user has consented
  if (!hasConsent) {
    return null
  }

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-N0XKF0819Q"
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-N0XKF0819Q', {
              'anonymize_ip': true,
              'cookie_flags': 'SameSite=None;Secure'
            });
          `,
        }}
      />
    </>
  )
}
