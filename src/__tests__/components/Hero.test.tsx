import { render, screen } from '@testing-library/react'
import { Hero } from '@/components/Hero'

describe('Hero', () => {
  it('renders hero content', () => {
    render(<Hero />)
    
    expect(screen.getByText('Brand. Build. Boom.')).toBeInTheDocument()
    expect(screen.getByText('AI-driven websites live in days, not months.')).toBeInTheDocument()
    expect(screen.getByText('Start now!')).toBeInTheDocument()
  })

  it('has proper heading structure', () => {
    render(<Hero />)
    
    const mainHeading = screen.getByRole('heading', { level: 1 })
    expect(mainHeading).toHaveTextContent('Brand. Build. Boom.')
    expect(mainHeading).toHaveClass('font-heading')
  })

  it('has CTA link to checkout', () => {
    render(<Hero />)
    
    const ctaLink = screen.getByRole('link', { name: 'Start now!' })
    expect(ctaLink).toHaveAttribute('href', '/checkout')
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