"use client"

import * as React from "react"
import { Globe } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { routing } from "@/i18n/routing"

type Locale = (typeof routing.locales)[number]
const locales = routing.locales

export function LanguageSelector() {
  const t = useTranslations('nav.language')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: Locale) => {
    const segments = pathname.split('/')
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = newLocale
    } else {
      segments.unshift('', newLocale)
    }
    
    const newPath = segments.join('/')
    router.push(newPath)
  }

  const getLocaleName = (locale: Locale) => {
    return locale === 'en' ? t('english') : t('italian')
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Select language</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          {locales.map((loc) => (
            <Button
              key={loc}
              variant={locale === loc ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => switchLocale(loc)}
            >
              <span className={`fi fi-${loc === 'en' ? 'us' : loc} mr-2`} />
              {getLocaleName(loc)}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}