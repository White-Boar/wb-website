'use client'

import Image from 'next/image'
import { useTheme } from '@/components/theme-provider'
import { useEffect, useState } from 'react'

interface WhiteBoarLogoProps {
  width?: number
  height?: number
  className?: string
}

export function WhiteBoarLogo({
  width = 100,
  height = 100,
  className = "text-accent dark:text-accent"
}: WhiteBoarLogoProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Only render after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)

    // Determine the resolved theme
    const determineTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        setResolvedTheme(systemTheme)
      } else {
        setResolvedTheme(theme as 'light' | 'dark')
      }
    }

    determineTheme()

    // Listen for system theme changes when theme is "system"
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light')
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  if (!mounted) {
    // Return default logo during server-side rendering and initial client render
    return (
      <Image
        src="/images/logo.png"
        alt="WhiteBoar Logo"
        width={width}
        height={height}
        className={className}
      />
    )
  }

  // Use white logo for dark theme, default logo for light theme
  const logoSrc = resolvedTheme === 'dark' ? '/images/logo-white.png' : '/images/logo.png'

  return (
    <Image
      src={logoSrc}
      alt="WhiteBoar Logo"
      width={width}
      height={height}
      className={className}
    />
  )
}