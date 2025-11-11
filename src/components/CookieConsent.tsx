"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { CookiePreferences } from "@/components/CookiePreferences"
import {
  acceptAllCookies,
  acceptEssentialOnly,
  hasGivenConsent,
} from "@/lib/cookie-consent"

export function CookieConsent() {
  const t = useTranslations('cookieConsent')
  const [isVisible, setIsVisible] = React.useState(false)
  const [showPreferences, setShowPreferences] = React.useState(false)

  React.useEffect(() => {
    // Check if user has already given consent
    const hasConsent = hasGivenConsent()
    setIsVisible(!hasConsent)
  }, [])

  const handleAcceptAll = () => {
    acceptAllCookies()
    setIsVisible(false)
  }

  const handleAcceptEssential = () => {
    acceptEssentialOnly()
    setIsVisible(false)
  }

  const handleManagePreferences = () => {
    setShowPreferences(true)
  }

  const handlePreferencesSaved = () => {
    setShowPreferences(false)
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg"
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
      >
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h2 id="cookie-consent-title" className="font-heading font-semibold text-foreground mb-1">
                {t('title')}
              </h2>
              <p id="cookie-consent-description" className="text-sm text-muted-foreground">
                {t('description')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManagePreferences}
                className="whitespace-nowrap"
              >
                {t('customize')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcceptEssential}
                className="whitespace-nowrap"
              >
                {t('essentialOnly')}
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="whitespace-nowrap"
              >
                {t('acceptAll')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CookiePreferences
        open={showPreferences}
        onOpenChange={setShowPreferences}
        onSave={handlePreferencesSaved}
      />
    </>
  )
}
