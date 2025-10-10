import { render, screen, fireEvent } from '@testing-library/react'
import { ThankYou } from '@/components/onboarding/ThankYou'

// Mock the onboarding store
const mockResetSession = jest.fn()
const mockUseHasActiveSession = jest.fn(() => false)

jest.mock('@/lib/store/onboarding-store', () => ({
  useOnboardingStore: () => ({
    resetSession: mockResetSession,
  }),
  useHasActiveSession: () => mockUseHasActiveSession(),
}))

describe('ThankYou Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders success message', () => {
    render(<ThankYou />)
    expect(screen.getByText(/onboarding.thankYou.title/)).toBeInTheDocument()
  })

  it('displays message about preview', () => {
    render(<ThankYou />)
    expect(screen.getByText(/onboarding.thankYou.message/)).toBeInTheDocument()
  })

  it('shows preview timeline', () => {
    render(<ThankYou />)
    expect(screen.getByText(/onboarding.thankYou.timeline.title/)).toBeInTheDocument()
  })

  it('shows notification information', () => {
    render(<ThankYou />)
    expect(screen.getByText(/onboarding.thankYou.notification.title/)).toBeInTheDocument()
  })

  it('shows payment information', () => {
    render(<ThankYou />)
    expect(screen.getByText(/onboarding.thankYou.payment.title/)).toBeInTheDocument()
  })

  it('clears session on mount', () => {
    render(<ThankYou />)
    expect(mockResetSession).toHaveBeenCalled()
  })

  it('has back to homepage button', () => {
    render(<ThankYou />)
    const backButton = screen.getByText(/onboarding.thankYou.backHome/)
    expect(backButton).toBeInTheDocument()
  })
})
