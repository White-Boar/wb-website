import React from 'react'
import { render } from '@testing-library/react'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import * as cookieConsentLib from '@/lib/cookie-consent'

jest.mock('@/lib/cookie-consent', () => ({
  isCategoryAllowed: jest.fn(),
}))

// Mock next/script
jest.mock('next/script', () => ({
  __esModule: true,
  default: ({ children, id, src }: any) => {
    if (src) {
      return <script data-testid={`script-${src}`} src={src} async />
    }
    return <script data-testid={`script-${id}`} async>{children}</script>
  },
}))

describe('GoogleAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset window event listeners
    window.removeEventListener = jest.fn()
    window.addEventListener = jest.fn()
  })

  it('should not render scripts when analytics consent is not given', () => {
    ;(cookieConsentLib.isCategoryAllowed as jest.Mock).mockReturnValue(false)

    const { container } = render(<GoogleAnalytics />)

    const scripts = container.querySelectorAll('script')
    expect(scripts).toHaveLength(0)
  })

  it('should render scripts when analytics consent is given', () => {
    ;(cookieConsentLib.isCategoryAllowed as jest.Mock).mockReturnValue(true)

    const { container } = render(<GoogleAnalytics />)

    const scripts = container.querySelectorAll('script')
    expect(scripts.length).toBeGreaterThan(0)
  })

  it('should add cookieConsentChange event listener on mount', () => {
    ;(cookieConsentLib.isCategoryAllowed as jest.Mock).mockReturnValue(false)

    render(<GoogleAnalytics />)

    expect(window.addEventListener).toHaveBeenCalledWith(
      'cookieConsentChange',
      expect.any(Function)
    )
  })

  it('should remove cookieConsentChange event listener on unmount', () => {
    ;(cookieConsentLib.isCategoryAllowed as jest.Mock).mockReturnValue(false)

    const { unmount } = render(<GoogleAnalytics />)
    unmount()

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'cookieConsentChange',
      expect.any(Function)
    )
  })
})
