import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { CookiePreferences } from '@/components/CookiePreferences'
import * as cookieConsentLib from '@/lib/cookie-consent'

jest.mock('@/lib/cookie-consent', () => ({
  getCookieConsent: jest.fn(),
  setCookieConsent: jest.fn(),
}))

const messages = {
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

describe('CookiePreferences', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnSave = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(cookieConsentLib.getCookieConsent as jest.Mock).mockReturnValue({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    })
  })

  it('should not render when open is false', () => {
    renderWithIntl(
      <CookiePreferences open={false} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />
    )

    expect(screen.queryByText('Cookie Preferences')).not.toBeInTheDocument()
  })

  it('should render when open is true', () => {
    renderWithIntl(
      <CookiePreferences open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />
    )

    expect(screen.getByText('Cookie Preferences')).toBeInTheDocument()
    expect(screen.getByText('Essential Cookies')).toBeInTheDocument()
    expect(screen.getByText('Analytics Cookies')).toBeInTheDocument()
    expect(screen.getByText('Marketing Cookies')).toBeInTheDocument()
  })

  it('should display essential cookies as always active', () => {
    renderWithIntl(
      <CookiePreferences open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />
    )

    expect(screen.getByText('Always Active')).toBeInTheDocument()
  })

  it('should call setCookieConsent and onSave when Save button is clicked', async () => {
    renderWithIntl(
      <CookiePreferences open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />
    )

    const saveButton = screen.getByText('Save Preferences')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(cookieConsentLib.setCookieConsent).toHaveBeenCalledWith({
        essential: true,
        analytics: false,
        marketing: false,
      })
      expect(mockOnSave).toHaveBeenCalledTimes(1)
    })
  })

  it('should call setCookieConsent with all enabled and onSave when Accept All is clicked', async () => {
    renderWithIntl(
      <CookiePreferences open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />
    )

    const acceptAllButton = screen.getAllByText('Accept All')[0]
    fireEvent.click(acceptAllButton)

    await waitFor(() => {
      expect(cookieConsentLib.setCookieConsent).toHaveBeenCalledWith({
        essential: true,
        analytics: true,
        marketing: true,
      })
      expect(mockOnSave).toHaveBeenCalledTimes(1)
    })
  })

  it('should load existing consent preferences when dialog opens', () => {
    const existingConsent = {
      essential: true,
      analytics: true,
      marketing: false,
      timestamp: Date.now(),
    }
    ;(cookieConsentLib.getCookieConsent as jest.Mock).mockReturnValue(existingConsent)

    const { rerender } = renderWithIntl(
      <CookiePreferences open={false} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />
    )

    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CookiePreferences open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />
      </NextIntlClientProvider>
    )

    expect(cookieConsentLib.getCookieConsent).toHaveBeenCalled()
  })
})
