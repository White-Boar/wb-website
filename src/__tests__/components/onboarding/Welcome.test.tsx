import { render, screen, fireEvent } from '@testing-library/react'
import { Welcome } from '@/components/onboarding/Welcome'

// Mock the WhiteBoarLogo component
jest.mock('@/components/WhiteBoarLogo', () => ({
  WhiteBoarLogo: () => <div data-testid="whiteboar-logo">Logo</div>,
}))

// Mock the onboarding store
const mockResetSession = jest.fn()
const mockSetCurrentStep = jest.fn()
const mockUseHasActiveSession = jest.fn(() => false)

jest.mock('@/lib/store/onboarding-store', () => ({
  useOnboardingStore: () => ({
    resetSession: mockResetSession,
    setCurrentStep: mockSetCurrentStep,
  }),
  useHasActiveSession: () => mockUseHasActiveSession(),
}))

describe('Welcome Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasActiveSession.mockReturnValue(false)
  })

  it('renders welcome title', () => {
    render(<Welcome />)
    expect(screen.getByText(/onboarding.welcome.title/)).toBeInTheDocument()
  })

  it('renders welcome subtitle', () => {
    render(<Welcome />)
    expect(screen.getByText(/onboarding.welcome.subtitle/)).toBeInTheDocument()
  })

  it('renders navigation header with logo', () => {
    render(<Welcome />)
    expect(screen.getByTestId('whiteboar-logo')).toBeInTheDocument()
    expect(screen.getByText('WhiteBoar')).toBeInTheDocument()
  })

  it('renders three value proposition cards', () => {
    render(<Welcome />)
    expect(screen.getByText(/onboarding.welcome.features.fast.title/)).toBeInTheDocument()
    expect(screen.getByText(/onboarding.welcome.features.secure.title/)).toBeInTheDocument()
    expect(screen.getByText(/onboarding.welcome.features.smart.title/)).toBeInTheDocument()
  })

  it('renders "How It Works" section', () => {
    render(<Welcome />)
    expect(screen.getByText(/onboarding.welcome.process.title/)).toBeInTheDocument()
  })

  it('renders "What You\'ll Need" section', () => {
    render(<Welcome />)
    expect(screen.getByText(/onboarding.welcome.requirements.title/)).toBeInTheDocument()
  })

  it('renders "Start Your Website" button', () => {
    render(<Welcome />)
    expect(screen.getByText(/onboarding.welcome.actions.start/)).toBeInTheDocument()
  })

  it('renders footer with copyright', () => {
    render(<Welcome />)
    expect(screen.getByText(/© 2025 WhiteBoar/)).toBeInTheDocument()
    expect(screen.getByText(/Secure & SSL Protected/)).toBeInTheDocument()
  })

  it('shows restart button when active session exists', () => {
    mockUseHasActiveSession.mockReturnValue(true)
    render(<Welcome />)
    expect(screen.getByText(/Restart/)).toBeInTheDocument()
  })

  it('calls resetSession when restart button is clicked', () => {
    mockUseHasActiveSession.mockReturnValue(true)
    render(<Welcome />)
    const restartButton = screen.getByText(/Restart/)
    fireEvent.click(restartButton)
    expect(mockResetSession).toHaveBeenCalled()
  })
})
