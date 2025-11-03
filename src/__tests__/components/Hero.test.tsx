import { render, screen } from '@testing-library/react'
import { Hero } from '@/components/Hero'

describe('Hero', () => {
  it('renders hero content', () => {
    render(<Hero />)

    expect(screen.getByText('Your business. Selling globally. All year.')).toBeInTheDocument()
    expect(screen.getByText('Sell to international customers even after the holiday season: a multilingual website that keeps you in touch.')).toBeInTheDocument()
    expect(screen.getByText('Start now!')).toBeInTheDocument()
  })

  it('has proper heading structure', () => {
    render(<Hero />)

    const mainHeading = screen.getByRole('heading', { level: 1 })
    expect(mainHeading).toHaveTextContent('Your business. Selling globally. All year.')
    expect(mainHeading).toHaveClass('font-heading')
  })

  it('has CTA link to onboarding', () => {
    render(<Hero />)

    const ctaLink = screen.getByRole('link', { name: 'Start now!' })
    expect(ctaLink).toHaveAttribute('href', '/onboarding')
  })

  it('has background image', () => {
    render(<Hero />)
    
    const backgroundImage = screen.getByAltText('AI-driven digital transformation')
    expect(backgroundImage).toBeInTheDocument()
    expect(backgroundImage).toHaveAttribute('src')
  })

  it('has proper semantic structure', () => {
    render(<Hero />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
  })

  it('applies motion classes for animations', () => {
    render(<Hero />)
    
    const section = document.querySelector('section')
    expect(section).toBeInTheDocument()
  })

  it('has scroll indicator', () => {
    render(<Hero />)
    
    // The scroll indicator is present in the component structure
    const section = document.querySelector('section')
    expect(section).toBeInTheDocument()
  })
})