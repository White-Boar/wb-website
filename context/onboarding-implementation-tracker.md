# White Boar Onboarding System Implementation Tracker

**Project Status**: 🚀 **Planning Phase**  
**Start Date**: January 2025  
**Target Completion**: 3-4 weeks  
**Last Updated**: January 9, 2025  

---

## 📋 Project Overview

### Goals & Success Metrics
- **Primary Goal**: Build a 13-step client onboarding system for "Fast & Simple" package (€40/month)
- **Target Completion Rate**: >25% (vs 10-20% industry average)
- **Target Completion Time**: <15 minutes average
- **Mobile Completion Target**: >40% of submissions
- **Performance Targets**: <3s initial load, <300ms step transitions
- **User Satisfaction Target**: >4.5/5 rating

### Technical Requirements
- **Framework**: Next.js 15+ with App Router & TypeScript
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Email Service**: Resend API for verification & notifications
- **State Management**: Zustand with localStorage persistence
- **Form Management**: React Hook Form + Zod validation
- **UI Components**: shadcn/ui with existing WhiteBoar design tokens
- **Internationalization**: next-intl (EN/IT)
- **Performance**: Framer Motion animations with reduced motion support

---

## 🔍 Quality Assurance Workflow

**MANDATORY STEPS after each task completion:**

### 1. Commit Code Changes
- **Commit Message Format**: `feat(onboarding): [task description] - implements [specific functionality]`
- **Examples**:
  - `feat(onboarding): add Zustand store setup - implements session management`
  - `feat(onboarding): create step template component - implements reusable step layout`
  - `fix(onboarding): resolve email validation issues - fixes Step 2 OTP validation`

### 2. Run Quality Assurance Agents
**Functional-QA Agent** - Run if ANY code changes made:
- Backend logic, API routes, database operations
- Form validation, state management, data processing
- Performance optimizations, security implementations
- Integration with external services (Supabase, Resend, Google Maps)

**Visual-QA Agent** - Run if ANY visual/UI changes made:
- React components, styling, responsive design
- User interface interactions, animations
- Accessibility compliance, design system adherence
- Mobile optimization, cross-browser compatibility

### 3. Fix All Outstanding Issues
- **Address ALL agent findings** before proceeding to next task
- **Document fixes** in commit messages
- **Re-run agents** if significant changes made during fixes

### 4. Update Task Status
- Mark task as completed in this tracker
- Add any implementation notes or decisions made
- Update any relevant documentation

## ✅ All Questions Resolved

**Business Logic & UX Decisions:**
- Email verification: 5 attempts before 15-minute lockout
- Session management: 7-day expiration with email reminders at 3 days  
- File uploads: Logo max 10MB (PNG/JPG/SVG), Photos max 50MB total
- Abandoned sessions: Reminder emails at 24 hours and 5 days
- Progress feedback: Temporary toast notifications
- Mobile navigation: Percentage-based progress bar
- Error handling: Reconnection prompt with auto-retry
- Step navigation: Allow backward navigation with data preservation

**Technical Configuration:**
- ✅ Supabase: Project set up with Vercel integration, environment variables configured
- ✅ Resend: Account created, environment variables configured
- ✅ Google Maps: API key created and added to environment variables  
- ✅ Domain: whiteboar.it confirmed
- ✅ URL Structure: whiteboar.it/onboarding
- ✅ Email Domain: noreply.notifications@whiteboar.it
- ✅ Environment Variables: Document all required variables for developer setup

**Content & Workflow:**
- Email templates: Use WhiteBoar design tokens, professional tone
- Italian translations: Initial implementation with review marking
- GDPR compliance: Standard compliance with explicit consent
- Preview generation: Manual process, 5 business day expectation
- Data retention: Keep indefinitely with export capability
- Admin notifications: Business name, email, completion date, and link to submission

**Integration & Analytics:**
- Analytics: Standard conversion tracking (steps, completions, errors)
- Payment integration: Email with landing page link (out of scope)
- CRM integration: Supabase storage only with export capability

---

## 🎯 Implementation Phases

### Phase 1: Dependencies & Environment Setup
**Status**: ⏳ **Pending**  
**Estimated Duration**: 3-4 days  
**Dependencies**: None  

#### Tasks:
- [ ] **1.1** Install Core Dependencies
  - [ ] React Hook Form ecosystem (`react-hook-form`, `@hookform/resolvers`, `@hookform/devtools`)
  - [ ] Validation & State (`zod`, `zustand`)
  - [ ] UI Libraries (`react-dropzone`, `sonner`, `react-international-phone`, `react-otp-input`)
  - [ ] Maps & Analytics (`@react-google-maps/api`, `@vercel/analytics`)
  - [ ] Utilities (`lodash.debounce`, `browser-image-compression`, `react-intersection-observer`, `nextjs-toploader`)
  - [ ] Email Service (`resend`)
  - [ ] Testing (`msw`, `@types/lodash.debounce`)

- [ ] **1.2** Environment Configuration
  - [ ] Create `.env.local` template with required variables
  - [ ] Configure Supabase connection
  - [ ] Set up Resend API key
  - [ ] Configure Google Maps API key
  - [ ] Set up Vercel Analytics
  - [ ] Update `next.config.js` for image domains and optimization

- [ ] **1.3** Supabase Database Setup
  - [ ] Create `onboarding_sessions` table with proper schema
  - [ ] Create `onboarding_submissions` table for completed forms
  - [ ] Create `onboarding_analytics` table for tracking
  - [ ] Create `onboarding_uploads` table for file management
  - [ ] Set up Row Level Security (RLS) policies
  - [ ] Create database indexes for performance
  - [ ] Configure file storage buckets for uploads

#### Design Decisions:
- **Zustand over Redux**: Simpler state management, better TypeScript support, smaller bundle
- **Supabase over Firebase**: Better PostgreSQL support, real-time capabilities, easier self-hosting
- **Resend over SendGrid**: Better developer experience, modern API, focused on transactional emails

---

### Phase 2: Core Architecture & State Management
**Status**: ⏳ **Pending**  
**Estimated Duration**: 2-3 days  
**Dependencies**: Phase 1 completion  

#### Tasks:
- [ ] **2.1** Zustand Store Implementation
  - [ ] Create `stores/onboarding.ts` with TypeScript interfaces
  - [ ] Implement session management (create, update, load, clear)
  - [ ] Add form data persistence with partial updates
  - [ ] Implement step navigation (next, previous, jump to step)
  - [ ] Add localStorage persistence with session recovery
  - [ ] Create auto-save functionality with debounced updates

- [ ] **2.2** Validation Schemas
  - [ ] Create `schemas/onboarding.ts` with Zod schemas for all steps
  - [ ] Implement Step 1: Name + Email validation
  - [ ] Implement Step 2: OTP validation (6 digits)
  - [ ] Implement Step 3: Business details with Italian VAT, phone, address
  - [ ] Implement Steps 4-6: Brand definition with text length validation
  - [ ] Implement Steps 7-10: Visual selection with required choices
  - [ ] Implement Steps 11-13: Website structure, file uploads, completion
  - [ ] Add conditional validation for dynamic fields
  - [ ] Create Italian-specific validation (VAT format, phone format)

- [ ] **2.3** Supabase Service Layer
  - [ ] Create `services/supabase.ts` with typed client
  - [ ] Implement session CRUD operations
  - [ ] Add progress saving with conflict resolution
  - [ ] Create session loading with expiration checks
  - [ ] Implement analytics event tracking
  - [ ] Add file upload management
  - [ ] Create completion workflow

- [ ] **2.4** Resend Email Service
  - [ ] Create `services/resend.ts` with typed API client
  - [ ] Implement OTP generation and storage
  - [ ] Create verification email template (EN/IT)
  - [ ] Add preview notification templates
  - [ ] Implement rate limiting for email sends
  - [ ] Add email delivery tracking
  - [ ] Create abandonment recovery emails

#### Design Decisions:
- **Zod over Yup**: Better TypeScript integration, more expressive schemas
- **Debounced auto-save**: Reduces server load while maintaining data integrity
- **Session-based approach**: Allows anonymous users to complete forms before account creation

---

### Phase 3: UI Components & Templates
**Status**: ⏳ **Pending**  
**Estimated Duration**: 4-5 days  
**Dependencies**: Phase 2 completion  

#### Tasks:
- [ ] **3.1** Base Components
  - [ ] Create `components/onboarding/StepTemplate.tsx` with consistent layout
  - [ ] Implement navigation buttons with proper states
  - [ ] Add auto-save indicator and success feedback
  - [ ] Create `ProgressBar` component with step indicators
  - [ ] Build reusable form field components:
    - [ ] `TextInput` with validation state
    - [ ] `EmailInput` with format validation
    - [ ] `PhoneInput` with international formatting
    - [ ] `TextareaInput` with character count
    - [ ] `DropdownInput` with search functionality

- [ ] **3.2** Specialized Components
  - [ ] Create `EmailVerification` with 6-digit OTP input
  - [ ] Build `FileUpload` with drag-drop, compression, preview
  - [ ] Implement `AddressAutocomplete` with Google Maps
  - [ ] Create `SliderInput` component for customer profile
  - [ ] Build `ImageGrid` selectors for design styles
  - [ ] Create `ColorPalette` selector component
  - [ ] Implement `DynamicList` for offerings management

- [ ] **3.3** Layout Structure
  - [ ] Create `app/[locale]/onboarding/layout.tsx`
  - [ ] Implement responsive design for mobile-first
  - [ ] Add progress bar to layout header
  - [ ] Create consistent spacing and typography
  - [ ] Implement proper focus management
  - [ ] Add loading states for async operations

#### Design Decisions:
- **Step Template Pattern**: Ensures consistency across all 13 steps
- **Compound Components**: Better composition and reusability
- **Mobile-First Design**: Targeting >40% mobile completion rate

---

### Phase 4: Step Implementation (All 13 Steps)
**Status**: ⏳ **Pending**  
**Estimated Duration**: 7-10 days  
**Dependencies**: Phase 3 completion  

#### Step 1: Welcome Screen
- [ ] **4.1.1** Create welcome page layout
- [ ] **4.1.2** Add motivational elements and statistics
- [ ] **4.1.3** Implement name + email collection
- [ ] **4.1.4** Add form validation and error handling
- [ ] **4.1.5** Create session initialization

#### Step 2: Email Verification
- [ ] **4.2.1** Create OTP input component
- [ ] **4.2.2** Implement code generation and storage
- [ ] **4.2.3** Add email sending via Resend
- [ ] **4.2.4** Create verification logic
- [ ] **4.2.5** Add resend functionality with rate limiting

#### Step 3: Business Basics
- [ ] **4.3.1** Create business information form
- [ ] **4.3.2** Implement Google Maps address autocomplete
- [ ] **4.3.3** Add industry dropdown from industries.json
- [ ] **4.3.4** Create Italian VAT validation
- [ ] **4.3.5** Add international phone formatting

#### Step 4: Brand Definition
- [ ] **4.4.1** Create offer description textarea
- [ ] **4.4.2** Implement competitor URL collection
- [ ] **4.4.3** Add uniqueness positioning sentence builder
- [ ] **4.4.4** Create URL validation for competitor links

#### Step 5: Customer Profile
- [ ] **4.5.1** Create combined slider component
- [ ] **4.5.2** Implement 5 customer attribute sliders:
  - [ ] Budget: Budget-Conscious ↔ Premium
  - [ ] Style: Traditional ↔ Modern
  - [ ] Motivation: Practical Solutions ↔ Experience
  - [ ] Decision Making: Spontaneous ↔ Researches Thoroughly
  - [ ] Loyalty: Price-Driven ↔ Brand-Loyal
- [ ] **4.5.3** Add slider value persistence and display

#### Step 6: Customer Needs
- [ ] **4.6.1** Create problem/solution text inputs
- [ ] **4.6.2** Add character count and validation
- [ ] **4.6.3** Implement customer delight input

#### Step 7: Visual Inspiration
- [ ] **4.7.1** Create URL collection component
- [ ] **4.7.2** Add website preview functionality
- [ ] **4.7.3** Implement URL validation and error handling

#### Step 8: Design Style Selection
- [ ] **4.8.1** Create image grid selector component
- [ ] **4.8.2** Add 6 design style options with images
- [ ] **4.8.3** Implement single selection logic

#### Step 9: Image Style Selection
- [ ] **4.9.1** Create image style grid
- [ ] **4.9.2** Add 6 image style options
- [ ] **4.9.3** Implement selection persistence

#### Step 10: Color Palette
- [ ] **4.10.1** Create color palette selector
- [ ] **4.10.2** Add 6 palette options with previews
- [ ] **4.10.3** Implement color selection logic

#### Step 11: Website Structure
- [ ] **4.11.1** Create multi-checkbox section selector
- [ ] **4.11.2** Add primary goal dropdown
- [ ] **4.11.3** Create conditional products/services selector
- [ ] **4.11.4** Implement dynamic offerings list

#### Step 12: Business Assets
- [ ] **4.12.1** Create logo upload component
- [ ] **4.12.2** Add business photos multi-upload
- [ ] **4.12.3** Implement image compression
- [ ] **4.12.4** Add file validation and preview

#### Step 13: Completion
- [ ] **4.13.1** Create completion confirmation page
- [ ] **4.13.2** Add submission logic
- [ ] **4.13.3** Implement preview notification email
- [ ] **4.13.4** Create next steps display

#### Design Decisions:
- **Progressive Enhancement**: Each step builds on previous data
- **Conditional Logic**: Dynamic fields based on previous selections
- **Image Optimization**: Automatic compression for uploaded files

---

### Phase 5: Advanced Features & Performance
**Status**: ⏳ **Pending**  
**Estimated Duration**: 4-5 days  
**Dependencies**: Phase 4 completion  

#### Tasks:
- [ ] **5.1** Performance Optimization
  - [ ] Implement dynamic imports for heavy components
  - [ ] Add image lazy loading and optimization
  - [ ] Create code splitting for step components
  - [ ] Optimize bundle size analysis
  - [ ] Add performance monitoring

- [ ] **5.2** Analytics & Tracking
  - [ ] Integrate Vercel Analytics
  - [ ] Create step-by-step conversion tracking
  - [ ] Add drop-off point analysis
  - [ ] Implement error tracking
  - [ ] Create completion funnel metrics

- [ ] **5.3** Session Recovery
  - [ ] Implement session expiration handling
  - [ ] Add auto-recovery for abandoned sessions
  - [ ] Create email reminders for incomplete forms
  - [ ] Add session cleanup for expired entries

#### Design Decisions:
- **Dynamic Imports**: Reduce initial bundle size, improve LCP
- **Analytics Strategy**: Focus on conversion optimization over vanity metrics

---

### Phase 6: Internationalization & Polish
**Status**: ⏳ **Pending**  
**Estimated Duration**: 3-4 days  
**Dependencies**: Phase 5 completion  

#### Tasks:
- [ ] **6.1** Complete Translations
  - [ ] Expand `en.json` with all step content
  - [ ] Create comprehensive `it.json` translations
  - [ ] Add validation error messages (EN/IT)
  - [ ] Create help text for complex fields
  - [ ] Add loading and success messages

- [ ] **6.2** UX Enhancements
  - [ ] Implement Framer Motion transitions
  - [ ] Add loading states and skeletons
  - [ ] Create success/error toasts with Sonner
  - [ ] Ensure keyboard navigation support
  - [ ] Add screen reader optimizations

- [ ] **6.3** Mobile Optimization
  - [ ] Optimize touch interactions
  - [ ] Improve mobile slider usability
  - [ ] Add swipe gestures for navigation
  - [ ] Optimize viewport handling
  - [ ] Test across device sizes

#### Design Decisions:
- **Animation Strategy**: Enhance UX without impacting performance
- **Accessibility First**: WCAG AA compliance throughout

---

### Phase 7: Testing & Quality Assurance
**Status**: ⏳ **Pending**  
**Estimated Duration**: 3-4 days  
**Dependencies**: Phase 6 completion  

#### Tasks:
- [ ] **7.1** Unit Testing
  - [ ] Jest tests for validation schemas
  - [ ] RTL tests for critical components
  - [ ] Zustand store testing
  - [ ] Email service testing with MSW

- [ ] **7.2** End-to-End Testing
  - [ ] Playwright tests for complete flow
  - [ ] Cross-browser testing
  - [ ] Mobile device testing
  - [ ] Performance testing
  - [ ] Accessibility validation with axe-core

- [ ] **7.3** Load & Security Testing
  - [ ] Concurrent session testing
  - [ ] File upload security testing
  - [ ] Rate limiting validation
  - [ ] Data sanitization testing

---

### Phase 8: Integration & Deployment
**Status**: ⏳ **Pending**  
**Estimated Duration**: 3-4 days  
**Dependencies**: Phase 7 completion  

#### Tasks:
- [ ] **8.1** Production Configuration
  - [ ] Environment variable setup
  - [ ] Resend domain configuration
  - [ ] Database production setup
  - [ ] CDN and image optimization

- [ ] **8.2** Monitoring & Analytics
  - [ ] Error tracking setup
  - [ ] Performance monitoring
  - [ ] Email deliverability tracking
  - [ ] Conversion analytics

- [ ] **8.3** Deployment & Launch
  - [ ] Vercel deployment configuration
  - [ ] Domain setup and SSL
  - [ ] Database migration and backups
  - [ ] Go-live checklist completion

---

## 🔧 Technical Architecture Decisions

### State Management: Zustand
**Rationale**: Simpler than Redux, excellent TypeScript support, smaller bundle size
**Implementation**: Single store with sliced state, localStorage persistence

### Form Management: React Hook Form + Zod
**Rationale**: Excellent performance, TypeScript integration, minimal re-renders
**Implementation**: Schema-driven validation, field-level error handling

### Email Service: Resend
**Rationale**: Modern API, excellent deliverability, developer-friendly
**Implementation**: Template-based emails, delivery tracking, rate limiting

### Database: Supabase
**Rationale**: PostgreSQL reliability, real-time features, auth integration
**Implementation**: Row-level security, optimized indexes, file storage

---

## 📊 Performance Metrics Tracking

### Current Status
- **Initial Load Time**: Not yet measured
- **Step Transition Time**: Not yet measured  
- **Mobile Completion Rate**: Not yet measured
- **Overall Completion Rate**: Not yet measured
- **Bundle Size**: Not yet measured

### Targets
- **Initial Load Time**: <3 seconds
- **Step Transition Time**: <300ms
- **Mobile Completion Rate**: >40%
- **Overall Completion Rate**: >25%
- **Bundle Size**: <500KB initial

---

## 🐛 Issues & Solutions Log

*No issues logged yet - will be updated during implementation*

---

## 📝 Implementation Notes

### Code Organization
- `components/onboarding/` - Step-specific components
- `stores/` - Zustand state management
- `services/` - External API integrations
- `schemas/` - Zod validation schemas
- `hooks/` - Custom React hooks

### Naming Conventions
- Components: PascalCase (`EmailVerification`)
- Hooks: camelCase with `use` prefix (`useOnboardingStore`)
- Services: camelCase (`resendService`)
- Types: PascalCase with descriptive names (`OnboardingFormData`)

### Testing Strategy
- Unit tests for business logic and validation
- Integration tests for component interactions
- E2E tests for critical user paths
- Performance tests for load times

---

**Next Steps**: Begin Phase 1 - Dependencies & Environment Setup