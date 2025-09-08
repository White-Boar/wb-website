# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WhiteBoar** is an AI-driven digital agency homepage built with Next.js 15+, featuring modern web standards and multilingual support. This is a production-ready website implementing the business requirements outlined in `context/CONTEXT.md`.

## Development Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:css` - Run Stylelint on CSS files
- `pnpm test` - Run Jest unit tests
- `pnpm test:watch` - Run Jest in watch mode
- `pnpm test:e2e` - Run Playwright e2e tests

## Architecture & Tech Stack

### Core Technologies
- **Next.js 15+** with app directory and TypeScript
- **next-intl** for internationalization (EN/IT)
- **shadcn/ui** components with Radix UI primitives
- **Tailwind CSS** with custom design tokens
- **Framer Motion** for animations with reduced motion support

### Project Structure
```
├── app/[locale]/          # Internationalized pages (EN default, /it for Italian)
├── components/            # React components (Navigation, Hero, etc.)
│   └── ui/               # shadcn/ui base components
├── lib/                  # Utilities and configuration
├── messages/             # i18n translation files
├── design-system/        # Design tokens and theme configuration
├── __tests__/           # Jest and Playwright tests
└── public/              # Static assets
```

## Key Implementation Details

### Design System Integration
- Uses existing `design-system/tokens.css` as single source of truth
- All colors, spacing, typography defined as CSS custom properties
- Tailwind config consumes design tokens via `--wb-*` variables
- Theme switching via localStorage with system preference fallback

### Internationalization
- Default locale: English (`/`)
- Italian: `/it` URL prefix
- All text content in `messages/en.json` and `messages/it.json`
- Server-side translations with `getTranslations()` for metadata

### Component Architecture
- Each major section is its own component file
- shadcn/ui components customized with WhiteBoar design tokens
- Framer Motion animations with `useReducedMotion()` support
- Keyboard navigation and focus management throughout

### Performance Requirements (from context/CONTEXT.md)
- Largest Contentful Paint ≤ 1.8s
- Cumulative Layout Shift < 0.1
- No unused JS > 50KB
- Images optimized with Next.js Image component

### Accessibility Standards
- WCAG AA compliance with axe-core testing
- Keyboard navigation with `focus-visible:outline-accent`
- Proper heading hierarchy and semantic HTML
- Screen reader support with ARIA labels

## Testing Strategy

### Unit Tests (Jest + RTL)
- All components tested for rendering and user interactions
- Theme switching and language selection functionality
- Accessibility attributes and keyboard navigation
- Located in `__tests__/components/`

### E2E Tests (Playwright)
- Homepage loading and navigation
- Language switching (`/` ↔ `/it`)
- Theme toggle (light/dark/system)
- Pricing plan selection flow
- Performance metrics (LCP, CLS)
- Accessibility validation with axe-core
- Located in `__tests__/e2e/`

## Important Files

- `app/[locale]/page.tsx:25` - Main homepage component assembly
- `components/Navigation.tsx:15` - Glass-morphic sticky navigation
- `components/Hero.tsx:25` - Full-viewport hero with Framer Motion
- `components/PricingTable.tsx:35` - Two-tier pricing (€40/month, €5,000+)
- `lib/i18n.ts` - Internationalization configuration
- `messages/en.json` - English translations
- `messages/it.json` - Italian translations

## Development Guidelines

- **Never use hard-coded colors** - always reference CSS custom properties
- **Maintain design token consistency** - use `--wb-*` variables only
- **Test accessibility** - run `pnpm test:e2e` before commits
- **Keep translations in sync** - update both `en.json` and `it.json`
- **Follow component patterns** - use existing shadcn/ui + design tokens approach
- **Performance first** - validate LCP and CLS requirements with tests

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/test.yml`) runs:
1. ESLint code quality checks
2. Jest unit tests with coverage
3. Next.js production build
4. Playwright e2e tests including performance validation
5. Accessibility testing with axe-core

The project is production-ready and meets all requirements specified in `context/CONTEXT.md`.