import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { CookieConsent } from '@/components/CookieConsent'
import * as cookieConsentLib from '@/lib/cookie-consent'

// Mock the cookie consent library
jest.mock('@/lib/cookie-consent', () => ({
  hasGivenConsent: jest.fn(),
  acceptAllCookies: jest.fn(),
  acceptEssentialOnly: jest.fn(),
  getCookieConsent: jest.fn(),
  setCookieConsent: jest.fn(),
  isCategoryAllowed: jest.fn(),
}))

const messages = {
  cookieConsent: {
    title: 'Cookie Consent',
    description: 'We use cookies to improve your experience',
    acceptAll: 'Accept All',
    essentialOnly: 'Essential Only',
    customize: 'Customize',
  },
  cookiePreferences: {
    title: 'Cookie Preferences',
    description: 'Manage your cookie preferences',
    essential: {
      title: 'Essential Cookies',
      description: 'Required for the website to function',
      alwaysActive: 'Always Active',
    },
    analytics: {
      title: 'Analytics Cookies',
      description: 'Help us understand how you use our website',
    },
    marketing: {
      title: 'Marketing Cookies',
      description: 'Used to deliver relevant advertisements',
    },
    cancel: 'Cancel',
    acceptAll: 'Accept All',
    savePreferences: 'Save Preferences',
  },
}

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  )
}

describe('CookieConsent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when user has already given consent', () => {
    ;(cookieConsentLib.hasGivenConsent as jest.Mock).mockReturnValue(true)

    renderWithIntl(<CookieConsent />)

    expect(screen.queryByText('Cookie Consent')).not.toBeInTheDocument()
  })

  it('should render when user has not given consent', async () => {
    ;(cookieConsentLib.hasGivenConsent as jest.Mock).mockReturnValue(false)

    renderWithIntl(<CookieConsent />)

    await waitFor(() => {
      expect(screen.getByText('Cookie Consent')).toBeInTheDocument()
    })
    expect(screen.getByText('We use cookies to improve your experience')).toBeInTheDocument()
  })

  it('should call acceptAllCookies when Accept All button is clicked', async () => {
    ;(cookieConsentLib.hasGivenConsent as jest.Mock).mockReturnValue(false)

    renderWithIntl(<CookieConsent />)

    await waitFor(() => {
      expect(screen.getByText('Accept All')).toBeInTheDocument()
    })

    const acceptAllButton = screen.getByText('Accept All')
    fireEvent.click(acceptAllButton)

    expect(cookieConsentLib.acceptAllCookies).toHaveBeenCalledTimes(1)
  })

  it('should call acceptEssentialOnly when Essential Only button is clicked', async () => {
    ;(cookieConsentLib.hasGivenConsent as jest.Mock).mockReturnValue(false)

    renderWithIntl(<CookieConsent />)

    await waitFor(() => {
      expect(screen.getByText('Essential Only')).toBeInTheDocument()
    })

    const essentialOnlyButton = screen.getByText('Essential Only')
    fireEvent.click(essentialOnlyButton)

    expect(cookieConsentLib.acceptEssentialOnly).toHaveBeenCalledTimes(1)
  })

  it('should hide banner after Accept All is clicked', async () => {
    ;(cookieConsentLib.hasGivenConsent as jest.Mock).mockReturnValue(false)

    renderWithIntl(<CookieConsent />)

    await waitFor(() => {
      expect(screen.getByText('Accept All')).toBeInTheDocument()
    })

    const acceptAllButton = screen.getByText('Accept All')
    fireEvent.click(acceptAllButton)

    await waitFor(() => {
      expect(screen.queryByText('Cookie Consent')).not.toBeInTheDocument()
    })
  })

  it('should hide banner after Essential Only is clicked', async () => {
    ;(cookieConsentLib.hasGivenConsent as jest.Mock).mockReturnValue(false)

    renderWithIntl(<CookieConsent />)

    await waitFor(() => {
      expect(screen.getByText('Essential Only')).toBeInTheDocument()
    })

    const essentialOnlyButton = screen.getByText('Essential Only')
    fireEvent.click(essentialOnlyButton)

    await waitFor(() => {
      expect(screen.queryByText('Cookie Consent')).not.toBeInTheDocument()
    })
  })

  it('should open preferences dialog when Customize button is clicked', async () => {
    ;(cookieConsentLib.hasGivenConsent as jest.Mock).mockReturnValue(false)
    ;(cookieConsentLib.getCookieConsent as jest.Mock).mockReturnValue({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    })

    renderWithIntl(<CookieConsent />)

    await waitFor(() => {
      expect(screen.getByText('Customize')).toBeInTheDocument()
    })

    const customizeButton = screen.getByText('Customize')
    fireEvent.click(customizeButton)

    await waitFor(() => {
      expect(screen.getByText('Cookie Preferences')).toBeInTheDocument()
    })
  })

  it('should have proper ARIA attributes', async () => {
    ;(cookieConsentLib.hasGivenConsent as jest.Mock).mockReturnValue(false)

    renderWithIntl(<CookieConsent />)

    await waitFor(() => {
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(dialog).toHaveAttribute('aria-labelledby', 'cookie-consent-title')
      expect(dialog).toHaveAttribute('aria-describedby', 'cookie-consent-description')
    })
  })
})
