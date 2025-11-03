import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { webcrypto } from 'crypto'

// Polyfill TextEncoder/TextDecoder for Node environment (required by Stripe SDK)
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill webcrypto for Stripe SDK async signature generation
if (!global.crypto) {
  global.crypto = webcrypto
}

// Mock next-intl/server
jest.mock('next-intl/server', () => ({
  getRequestConfig: jest.fn((config) => config),
  getTranslations: async () => (key) => key,
  getLocale: async () => 'en',
  getMessages: async () => ({}),
  setRequestLocale: jest.fn(),
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (namespace = '') => (key) => {
    const mockTranslations = {
      'nav.services': 'Services',
      'nav.clients': 'Clients',
      'nav.start': 'Start',
      'nav.theme.light': 'Light',
      'nav.theme.dark': 'Dark',
      'nav.theme.system': 'System',
      'nav.language.english': 'English',
      'nav.language.italian': 'Italian',
      'hero.title': 'Your business. Selling globally. All year.',
      'hero.subtitle': 'Sell to international customers even after the holiday season: a multilingual website that keeps you in touch.',
      'hero.cta': 'Start now!',
      'steps.title': 'Three simple steps',
      'steps.step1.title': 'Start now',
      'steps.step1.subtitle': 'Tell us about your vision',
      'steps.step1.description': 'In just 15 minutes, our smart form captures the essence of your business.',
      'steps.step2.title': 'Approve your project',
      'steps.step2.subtitle': "In five days, you'll receive a complete website",
      'steps.step2.description': 'Beautiful, branded, and ready to launch in English and Italian.',
      'steps.step3.title': 'Go live & grow',
      'steps.step3.subtitle': 'Launch your business online',
      'steps.step3.description': 'Attract new customers and build lasting loyalty through our platform.',
      'pricing.title': 'Services',
      'pricing.fast.name': 'Fast & Simple',
      'pricing.fast.tagline': 'Personalized one-page website',
      'pricing.fast.price': '€35 / month',
      'pricing.fast.feature1': 'Personalized branding',
      'pricing.fast.feature2': 'Delivered in 5 business days',
      'pricing.fast.feature3': 'Multilingual: English and Italian included (more on request)',
      'pricing.fast.feature4': 'Search engine visibility',
      'pricing.fast.feature5': 'Adjustment package included',
      'pricing.fast.feature6': 'Hosting included (10k visits per month)',
      'pricing.custom.name': 'Custom Made',
      'pricing.custom.tagline': 'Custom software development',
      'pricing.custom.price': 'from €3,000',
      'pricing.custom.feature1': 'AI integrations and automation',
      'pricing.custom.feature2': 'E-commerce solutions',
      'pricing.custom.feature3': 'Mobile apps',
      'pricing.custom.feature4': 'Web applications & dashboards',
      'pricing.custom.feature5': 'SaaS platforms',
      'pricing.addons': 'Add-ons',
      'pricing.addonsDescription': 'Enhance your package with additional services',
      'portfolio.title': 'Clients',
      'portfolio.subtitle': 'See what we\'ve built for businesses like yours',
      'footer.brandDescription': 'AI-driven digital agency empowering small businesses with professional online presence.',
      'footer.quickLinks': 'Quick Links',
      'footer.followUs': 'Follow Us',
      'footer.copyright': '© 2025 WhiteBoar · VAT No. 1234567890',
      'customSoftware.form.title': 'Tell Us About Your Project',
      'customSoftware.form.subtitle': 'Share your vision and we\'ll help bring it to life',
      'customSoftware.form.nameLabel': 'Name',
      'customSoftware.form.namePlaceholder': 'Your name',
      'customSoftware.form.emailLabel': 'Email',
      'customSoftware.form.emailPlaceholder': 'your@email.com',
      'customSoftware.form.phoneLabel': 'Phone',
      'customSoftware.form.phonePlaceholder': '+39 123 456 7890',
      'customSoftware.form.descriptionLabel': 'Describe what you would like us to build',
      'customSoftware.form.descriptionPlaceholder': 'Tell us about your project, goals, and any specific requirements...',
      'customSoftware.form.submitButton': 'Send',
      'customSoftware.form.submitting': 'Sending...',
      'customSoftware.form.success.title': 'Thank you!',
      'customSoftware.form.success.message': 'We will be in touch within 2 business days.',
      'customSoftware.form.errors.nameRequired': 'Name is required',
      'customSoftware.form.errors.nameTooShort': 'Name must be at least 2 characters',
      'customSoftware.form.errors.emailRequired': 'Email is required',
      'customSoftware.form.errors.emailInvalid': 'Please enter a valid email address',
      'customSoftware.form.errors.phoneRequired': 'Phone is required',
      'customSoftware.form.errors.phoneInvalid': 'Please enter a valid phone number',
      'customSoftware.form.errors.descriptionRequired': 'Project description is required',
      'customSoftware.form.errors.descriptionTooShort': 'Please provide more details (at least 20 characters)',
      'customSoftware.form.errors.submitFailed': 'Failed to send your request. Please try again.',
    }

    const fullKey = namespace ? `${namespace}.${key}` : key
    return mockTranslations[fullKey] || fullKey
  },
  useLocale: () => 'en',
  getTranslations: async () => (key) => key,
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'en' }),
}))

// Mock next-intl/navigation
jest.mock('next-intl/navigation', () => ({
  createNavigation: () => ({
    Link: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
    redirect: jest.fn(),
    usePathname: () => '/',
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }),
    getPathname: jest.fn(() => '/'),
  }),
}))

// Mock @/i18n/navigation
jest.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
  redirect: jest.fn(),
  usePathname: () => '/',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  getPathname: jest.fn(() => '/'),
}))

// Mock @/lib/i18n
jest.mock('@/lib/i18n', () => ({
  locales: ['en', 'it'],
  default: jest.fn(),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, variants, initial, animate, whileInView, viewport, ...props }) => <div {...props}>{children}</div>,
    nav: ({ children, variants, initial, animate, whileInView, viewport, ...props }) => <nav {...props}>{children}</nav>,
    h1: ({ children, variants, initial, animate, whileInView, viewport, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, variants, initial, animate, whileInView, viewport, ...props }) => <h2 {...props}>{children}</h2>,
    p: ({ children, variants, initial, animate, whileInView, viewport, ...props }) => <p {...props}>{children}</p>,
    button: ({ children, variants, initial, animate, whileInView, viewport, ...props }) => <button {...props}>{children}</button>,
  },
  useReducedMotion: () => false,
}))

// Mock design system motion variants
jest.mock('./context/design-system/motion/variants', () => ({
  fadeInUp: { hidden: {}, show: {} },
  slideFade: () => ({ hidden: {}, show: {} }),
  staggerChildren: { hidden: {}, show: {} },
  scaleIn: { hidden: {}, show: {} },
  slideUp: { hidden: {}, show: {} }
}))

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, priority, placeholder, blurDataURL, sizes, ...props }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} style={fill ? { objectFit: 'cover' } : {}} />
  },
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})