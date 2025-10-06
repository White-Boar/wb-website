import { render, screen, fireEvent } from '@testing-library/react'
import { PricingTable } from '@/components/PricingTable'

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
    
    expect(screen.getByText('Packages')).toBeInTheDocument()
    expect(screen.getByText('Fast & Simple')).toBeInTheDocument()
    expect(screen.getByText('Custom-made')).toBeInTheDocument()
  })

  it('displays plan details correctly', () => {
    render(<PricingTable />)
    
    // Fast & Simple plan
    expect(screen.getByText('Let the world know you exist.')).toBeInTheDocument()
    expect(screen.getByText('€40 / month')).toBeInTheDocument()
    
    // Custom-made plan
    expect(screen.getByText('Custom web apps. No limits. Just results.')).toBeInTheDocument()
    expect(screen.getByText('from €5,000 + €40 / month')).toBeInTheDocument()
  })

  it('shows features for each plan', () => {
    render(<PricingTable />)
    
    // Check if features are displayed (they come from translation mock)
    expect(screen.getByText(/Branding/)).toBeInTheDocument()
    expect(screen.getByText(/SaaS platforms/)).toBeInTheDocument()
  })

  it('has CTA links for both plans', () => {
    render(<PricingTable />)

    const fastLink = screen.getByRole('link', { name: 'Start with Fast & Simple' })
    const customLink = screen.getByRole('link', { name: 'Start with Custom-made' })

    expect(fastLink).toBeInTheDocument()
    expect(customLink).toBeInTheDocument()
  })

  it('has correct href for plan links', () => {
    render(<PricingTable />)

    const fastLink = screen.getByRole('link', { name: 'Start with Fast & Simple' })
    const customLink = screen.getByRole('link', { name: 'Start with Custom-made' })

    expect(fastLink).toHaveAttribute('href', '/en/onboarding')
    expect(customLink).toHaveAttribute('href', '/en/custom-software')
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

    const heading = screen.getByRole('heading', { name: 'Packages' })
    expect(heading).toBeInTheDocument()

    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })
})