import { render, screen, fireEvent } from '@testing-library/react'
import { PricingTable } from '@/components/PricingTable'

// Mock next-intl to return translation keys
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}))

// Mock window.location
const mockLocationAssign = jest.fn()
Object.defineProperty(window, 'location', {
  value: { href: '' },
  writable: true
})

describe('PricingTable', () => {
  beforeEach(() => {
    mockLocationAssign.mockClear()
    window.location.href = ''
  })

  it('renders pricing section', () => {
    render(<PricingTable />)

    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByText('fast.name')).toBeInTheDocument()
    expect(screen.getByText('custom.name')).toBeInTheDocument()
  })

  it('displays plan details correctly', () => {
    render(<PricingTable />)

    // Fast & Simple plan
    expect(screen.getByText('fast.tagline')).toBeInTheDocument()
    expect(screen.getByText('fast.price')).toBeInTheDocument()

    // Custom Made plan
    expect(screen.getByText('custom.tagline')).toBeInTheDocument()
    expect(screen.getByText('custom.price')).toBeInTheDocument()
  })

  it('shows features for each plan', () => {
    render(<PricingTable />)

    // Check if features are displayed (they come from translation keys)
    expect(screen.getByText('fast.feature1')).toBeInTheDocument()
    expect(screen.getByText('custom.feature5')).toBeInTheDocument()
  })

  it('has CTA links for both plans', () => {
    render(<PricingTable />)

    const fastLink = screen.getByRole('link', { name: 'Start with Fast & Simple' })
    const customLink = screen.getByRole('link', { name: 'Start with Custom Made' })

    expect(fastLink).toBeInTheDocument()
    expect(customLink).toBeInTheDocument()
  })

  it('has correct href for plan links', () => {
    render(<PricingTable />)

    const fastLink = screen.getByRole('link', { name: 'Start with Fast & Simple' })
    const customLink = screen.getByRole('link', { name: 'Start with Custom Made' })

    expect(fastLink).toHaveAttribute('href', '/onboarding')
    expect(customLink).toHaveAttribute('href', '/custom-software')
  })

  it('shows popular badge on fast plan', () => {
    render(<PricingTable />)
    
    expect(screen.getByText('Most Popular')).toBeInTheDocument()
  })

  it('has proper section id for navigation', () => {
    render(<PricingTable />)
    
    const section = document.querySelector('#pricing')
    expect(section).toBeInTheDocument()
  })

  it('has accessible structure', () => {
    render(<PricingTable />)

    const heading = screen.getByRole('heading', { name: 'title' })
    expect(heading).toBeInTheDocument()

    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })
})