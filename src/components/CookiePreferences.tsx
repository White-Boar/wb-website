"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { getCookieConsent, setCookieConsent, type CookieConsent } from "@/lib/cookie-consent"

interface CookiePreferencesProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function CookiePreferences({ open, onOpenChange, onSave }: CookiePreferencesProps) {
  const t = useTranslations('cookiePreferences')
  const [preferences, setPreferences] = React.useState<Omit<CookieConsent, 'timestamp'>>({
    essential: true,
    analytics: false,
    marketing: false,
  })

  React.useEffect(() => {
    if (open) {
      const consent = getCookieConsent()
      if (consent) {
        setPreferences({
          essential: consent.essential,
          analytics: consent.analytics,
          marketing: consent.marketing,
        })
      }
    }
  }, [open])

  const handleSave = () => {
    setCookieConsent(preferences)
    onSave()
  }

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
    }
    setPreferences(allAccepted)
    setCookieConsent(allAccepted)
    onSave()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Essential Cookies */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {t('essential.title')}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('essential.description')}
                </p>
              </div>
              <Switch
                checked={preferences.essential}
                disabled
                aria-label={t('essential.title')}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('essential.alwaysActive')}
            </p>
          </div>

          {/* Analytics Cookies */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {t('analytics.title')}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('analytics.description')}
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked: boolean) =>
                  setPreferences({ ...preferences, analytics: checked })
                }
                aria-label={t('analytics.title')}
              />
            </div>
          </div>

          {/* Marketing Cookies */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {t('marketing.title')}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('marketing.description')}
                </p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked: boolean) =>
                  setPreferences({ ...preferences, marketing: checked })
                }
                aria-label={t('marketing.title')}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button variant="outline" onClick={handleAcceptAll}>
            {t('acceptAll')}
          </Button>
          <Button onClick={handleSave}>
            {t('savePreferences')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
