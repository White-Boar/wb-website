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

    expect(screen.getByText('Services')).toBeInTheDocument()
    expect(screen.getByText('Fast & Simple')).toBeInTheDocument()
    expect(screen.getByText('Custom Made')).toBeInTheDocument()
  })

  it('displays plan details correctly', () => {
    render(<PricingTable />)

    // Fast & Simple plan
    expect(screen.getByText('Personalized one-page website')).toBeInTheDocument()
    expect(screen.getByText('€35 / month')).toBeInTheDocument()

    // Custom Made plan
    expect(screen.getByText('Custom software development')).toBeInTheDocument()
    expect(screen.getByText('from €3,000')).toBeInTheDocument()
  })

  it('shows features for each plan', () => {
    render(<PricingTable />)

    // Check if features are displayed (they come from translation mock)
    expect(screen.getByText(/Personalized branding/)).toBeInTheDocument()
    expect(screen.getByText(/SaaS platforms/)).toBeInTheDocument()
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

    const heading = screen.getByRole('heading', { name: 'Services' })
    expect(heading).toBeInTheDocument()

    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })
})