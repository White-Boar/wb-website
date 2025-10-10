import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StepNavigation } from '@/components/onboarding/StepNavigation'

// Mock the onboarding store
const mockSetCurrentStep = jest.fn()

jest.mock('@/lib/store/onboarding-store', () => ({
  useOnboardingStore: () => ({
    setCurrentStep: mockSetCurrentStep,
  }),
}))

describe('StepNavigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders Next button on first step', () => {
    render(<StepNavigation currentStep={1} />)
    expect(screen.getByText(/onboarding.next/)).toBeInTheDocument()
  })

  it('does not render Back button on first step', () => {
    render(<StepNavigation currentStep={1} />)
    expect(screen.queryByText(/onboarding.previous/)).not.toBeInTheDocument()
  })

  it('calls default next behavior when Next is clicked', async () => {
    render(<StepNavigation currentStep={1} />)
    const nextButton = screen.getByText(/onboarding.next/)
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(mockSetCurrentStep).toHaveBeenCalledWith(13)
    })
  })

  it('calls custom onNext callback when provided', async () => {
    const mockOnNext = jest.fn()
    render(<StepNavigation currentStep={1} onNext={mockOnNext} />)
    const nextButton = screen.getByText(/onboarding.next/)
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalled()
    })
  })

  it('shows loading state during navigation', async () => {
    const mockOnNext = jest.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )
    render(<StepNavigation currentStep={1} onNext={mockOnNext} />)
    const nextButton = screen.getByText(/onboarding.next/)

    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText(/onboarding.loading/)).toBeInTheDocument()
    })
  })

  it('disables Next button when isNextDisabled=true', () => {
    render(<StepNavigation currentStep={1} isNextDisabled={true} />)
    const nextButton = screen.getByRole('button', { name: /onboarding.next/ })
    expect(nextButton).toBeDisabled()
  })

  it('renders both Back and Next on middle steps', () => {
    render(<StepNavigation currentStep={5} />)
    expect(screen.getByText(/onboarding.previous/)).toBeInTheDocument()
    expect(screen.getByText(/onboarding.next/)).toBeInTheDocument()
  })

  it('does not render Next button on last step', () => {
    render(<StepNavigation currentStep={13} />)
    expect(screen.queryByText(/onboarding.next/)).not.toBeInTheDocument()
  })

  it('calls onBack callback when provided', () => {
    const mockOnBack = jest.fn()
    render(<StepNavigation currentStep={5} onBack={mockOnBack} />)
    const backButton = screen.getByText(/onboarding.previous/)
    fireEvent.click(backButton)

    expect(mockOnBack).toHaveBeenCalled()
  })

  it('has proper ARIA labels', () => {
    render(<StepNavigation currentStep={5} />)
    expect(screen.getByLabelText(/onboarding.next/)).toBeInTheDocument()
    expect(screen.getByLabelText(/onboarding.previous/)).toBeInTheDocument()
  })
})
