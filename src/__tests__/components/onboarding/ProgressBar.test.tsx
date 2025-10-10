import { render, screen } from '@testing-library/react'
import { ProgressBar } from '@/components/onboarding/ProgressBar'

// Mock the onboarding store
let mockCurrentStep = 1

jest.mock('@/lib/store/onboarding-store', () => ({
  useOnboardingStore: (selector: (state: { currentStep: number }) => number) =>
    selector({ currentStep: mockCurrentStep }),
}))

describe('ProgressBar Component', () => {
  beforeEach(() => {
    mockCurrentStep = 1
  })

  it('renders progress bar', () => {
    render(<ProgressBar />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeInTheDocument()
  })

  it('shows step 1 of 2 for current step 1', () => {
    mockCurrentStep = 1
    render(<ProgressBar />)
    expect(screen.getByText(/onboarding.step/)).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText(/onboarding.of/)).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows 50% progress for step 1', () => {
    mockCurrentStep = 1
    render(<ProgressBar />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows step 2 of 2 for step 13 (thank you)', () => {
    mockCurrentStep = 13
    render(<ProgressBar />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows 100% progress for step 13', () => {
    mockCurrentStep = 13
    render(<ProgressBar />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('has proper ARIA attributes', () => {
    mockCurrentStep = 1
    const { container } = render(<ProgressBar />)
    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '2')
    expect(progressBar).toHaveAttribute('aria-valuenow', '1')
  })
})
