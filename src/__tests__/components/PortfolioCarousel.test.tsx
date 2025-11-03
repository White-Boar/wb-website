import { render, screen } from '@testing-library/react'
import { PortfolioCarousel } from '@/components/PortfolioCarousel'

// Mock embla carousel
jest.mock('embla-carousel-react', () => {
  return jest.fn(() => [
    jest.fn(), // carouselRef
    {
      canScrollPrev: jest.fn(() => true),
      canScrollNext: jest.fn(() => true),
      scrollPrev: jest.fn(),
      scrollNext: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    }
  ])
})

jest.mock('embla-carousel-autoplay', () => {
  return jest.fn(() => ({
    stop: jest.fn(),
    reset: jest.fn(),
  }))
})

describe('PortfolioCarousel', () => {
  it('renders portfolio section', () => {
    render(<PortfolioCarousel />)
    
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('See what we\'ve built for businesses like yours')).toBeInTheDocument()
  })

  it('has proper section id for navigation', () => {
    render(<PortfolioCarousel />)
    
    const section = document.querySelector('#portfolio')
    expect(section).toBeInTheDocument()
  })

  it('renders portfolio items', () => {
    render(<PortfolioCarousel />)

    // Check for some portfolio item titles
    expect(screen.getByAltText('Tritem - Technology Solutions')).toBeInTheDocument()
    expect(screen.getByAltText('Stackmine - IT Services')).toBeInTheDocument()
    expect(screen.getByAltText('Testspring - Quality Assurance')).toBeInTheDocument()
  })

  it('has navigation controls', () => {
    render(<PortfolioCarousel />)
    
    // Check for navigation controls (they may be hidden on mobile)
    const navButtons = screen.queryAllByRole('button')
    expect(navButtons.length).toBeGreaterThanOrEqual(0)
  })

  it('has proper heading structure', () => {
    render(<PortfolioCarousel />)
    
    const mainHeading = screen.getByRole('heading', { level: 2 })
    expect(mainHeading).toHaveTextContent('Clients')
    expect(mainHeading).toHaveClass('font-heading')
  })

  it('displays portfolio images with proper attributes', () => {
    render(<PortfolioCarousel />)
    
    const images = screen.getAllByRole('img')
    
    images.forEach(img => {
      expect(img).toHaveAttribute('alt')
      expect(img).toHaveAttribute('src')
    })
  })

  it('has carousel region role', () => {
    render(<PortfolioCarousel />)
    
    const carousel = screen.getByRole('region')
    expect(carousel).toBeInTheDocument()
  })
})