"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { X, Linkedin, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { CookiePreferences } from "@/components/CookiePreferences"
import { getCookieConsent, setCookieConsent, hasGivenConsent } from "@/lib/cookie-consent"

export function Footer() {
  const t = useTranslations('footer')
  const navT = useTranslations('nav')
  const [showCookiePreferences, setShowCookiePreferences] = React.useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState(false)
  const [marketingEnabled, setMarketingEnabled] = React.useState(false)
  const [hasConsent, setHasConsent] = React.useState(false)

  React.useEffect(() => {
    // Check if user has given consent
    const consentGiven = hasGivenConsent()
    setHasConsent(consentGiven)

    if (consentGiven) {
      const consent = getCookieConsent()
      if (consent) {
        setAnalyticsEnabled(consent.analytics)
        setMarketingEnabled(consent.marketing)
      }
    }

    // Listen for consent changes
    const handleConsentChange = () => {
      const newConsentGiven = hasGivenConsent()
      setHasConsent(newConsentGiven)

      if (newConsentGiven) {
        const consent = getCookieConsent()
        if (consent) {
          setAnalyticsEnabled(consent.analytics)
          setMarketingEnabled(consent.marketing)
        }
      }
    }

    window.addEventListener('cookieConsentChange', handleConsentChange)
    return () => {
      window.removeEventListener('cookieConsentChange', handleConsentChange)
    }
  }, [])

  const handleAnalyticsChange = (checked: boolean) => {
    setAnalyticsEnabled(checked)
    const consent = getCookieConsent()
    if (consent) {
      setCookieConsent({
        essential: true,
        analytics: checked,
        marketing: consent.marketing,
      })
    }
  }

  const handleMarketingChange = (checked: boolean) => {
    setMarketingEnabled(checked)
    const consent = getCookieConsent()
    if (consent) {
      setCookieConsent({
        essential: true,
        analytics: consent.analytics,
        marketing: checked,
      })
    }
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="font-heading font-bold text-sm text-black">WB</span>
              </div>
              <span className="font-heading font-bold text-lg text-gray-900 dark:text-white">
                WhiteBoar
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-sm">
              {t('brandDescription')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-gray-900 dark:text-white">
              {t('quickLinks')}
            </h3>
            <nav className="flex flex-col space-y-3" aria-label="Footer navigation">
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-left focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                {navT('services')}
              </button>
              <button
                onClick={() => scrollToSection('portfolio')}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-left focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                {navT('clients')}
              </button>
              <Link
                href="/checkout"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                {navT('start')}
              </Link>
              <Link
                href="/terms"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/privacy"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                Privacy Policy
              </Link>
              <button
                onClick={() => setShowCookiePreferences(true)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-left focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
              >
                {t('manageCookies')}
              </button>
            </nav>
          </div>

          {/* Cookie Settings */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-gray-900 dark:text-white">
              {t('cookieSettings')}
            </h3>
            {hasConsent ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="analytics-switch"
                    className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer"
                  >
                    {t('analytics')}
                  </label>
                  <Switch
                    id="analytics-switch"
                    checked={analyticsEnabled}
                    onCheckedChange={handleAnalyticsChange}
                    aria-label={t('analytics')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="marketing-switch"
                    className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer"
                  >
                    {t('marketing')}
                  </label>
                  <Switch
                    id="marketing-switch"
                    checked={marketingEnabled}
                    onCheckedChange={handleMarketingChange}
                    aria-label={t('marketing')}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('manageCookies')}
              </p>
            )}
            <div className="flex space-x-2 pt-2">
              <Button variant="ghost" size="icon" asChild>
                <a
                  href="https://twitter.com/whiteboar_ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  <X className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a
                  href="https://linkedin.com/company/whiteboar"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a
                  href="https://github.com/whiteboar"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-center text-gray-600 dark:text-gray-300 text-sm">
            {t('copyright')}
          </p>
        </div>
      </div>

      <CookiePreferences
        open={showCookiePreferences}
        onOpenChange={setShowCookiePreferences}
        onSave={() => setShowCookiePreferences(false)}
      />
    </footer>
  )
}