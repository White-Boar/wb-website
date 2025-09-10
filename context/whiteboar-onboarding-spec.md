# White Boar Client Onboarding Specification v2.0
## Complete Technical Implementation Guide

## Executive Summary

This document provides the complete specification for White Boar's client onboarding system, including detailed technical implementation guidelines, library choices, and architecture decisions. The system is designed to onboard Italian SMB clients for the "Fast & Simple" website package (€40/month), delivering a preview before payment collection.

## Golden rule
After making any UI changes, run playwrite mcp to inspect the website visually and make sure it looks as intended.

### Key Metrics & Goals
- **Target Completion Rate**: >25% (industry average: 10-20%)
- **Time to Complete**: <15 minutes
- **Mobile Completion**: >40% of submissions
- **Performance**: <3s initial load, <300ms step transitions
- **User Satisfaction**: >4.5/5 rating

### Core Features
- 12-step multi-step form with ~24 questions
- Server-side session management via Supabase
- Preview-first payment model
- Mobile-optimized responsive design
- Full keyboard navigation support
- Real-time progress saving with auto-recovery
- GDPR compliant with Italian market focus

## Technical Stack

### Core Technologies
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 3.4+
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Hosting**: Vercel
- **Payment**: Stripe (post-preview)

### Essential Libraries

```json
{
  "dependencies": {
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "zustand": "^4.4.0",
    "framer-motion": "^10.16.0",
    "react-dropzone": "^14.2.0",
    "embla-carousel-react": "^8.0.0",
    "sonner": "^1.3.0",
    "react-international-phone": "^4.2.0",
    "react-otp-input": "^3.1.0",
    "@react-google-maps/api": "^2.19.0",
    "@vercel/analytics": "^1.1.0",
    "lodash.debounce": "^4.0.8",
    "browser-image-compression": "^2.0.0",
    "react-intersection-observer": "^9.5.0",
    "nextjs-toploader": "^1.6.0"
  },
  "devDependencies": {
    "@hookform/devtools": "^4.3.0",
    "msw": "^2.0.0",
    "@types/lodash.debounce": "^4.0.9"
  }
}
```

### Installation Commands

```bash
# Production dependencies
npm install react-hook-form zod @hookform/resolvers zustand framer-motion react-dropzone embla-carousel-react sonner react-international-phone react-otp-input @react-google-maps/api @vercel/analytics lodash.debounce browser-image-compression react-intersection-observer nextjs-toploader

# Development dependencies
npm install --save-dev @hookform/devtools msw @types/lodash.debounce
```

## System Architecture

### Database Schema

```sql
-- Onboarding sessions table
CREATE TABLE onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  current_step INTEGER DEFAULT 1,
  form_data JSONB DEFAULT '{}',
  last_activity TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Completed submissions table
CREATE TABLE onboarding_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES onboarding_sessions(id),
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  form_data JSONB NOT NULL,
  preview_sent_at TIMESTAMP,
  payment_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE onboarding_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES onboarding_sessions(id),
  event_type TEXT NOT NULL, -- 'step_view', 'step_complete', 'field_error', 'abandon'
  step_number INTEGER,
  field_name TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- File uploads table
CREATE TABLE onboarding_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES onboarding_sessions(id),
  file_type TEXT NOT NULL, -- 'logo', 'photo'
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sessions_email ON onboarding_sessions(email);
CREATE INDEX idx_sessions_expires ON onboarding_sessions(expires_at);
CREATE INDEX idx_analytics_session ON onboarding_analytics(session_id);
CREATE INDEX idx_uploads_session ON onboarding_uploads(session_id);
```

### State Management Architecture

```typescript
// stores/onboarding.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FormData, StepData } from '@/types/onboarding'

interface OnboardingStore {
  // State
  sessionId: string | null
  currentStep: number
  formData: Partial<FormData>
  completedSteps: number[]
  lastSaved: Date | null
  
  // Actions
  initSession: (sessionId: string) => void
  updateFormData: (stepData: Partial<FormData>) => void
  setCurrentStep: (step: number) => void
  markStepComplete: (step: number) => void
  nextStep: () => void
  previousStep: () => void
  saveProgress: () => Promise<void>
  loadSession: (sessionId: string) => Promise<void>
  clearSession: () => void
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      // Implementation
    }),
    {
      name: 'wb-onboarding',
      partialize: (state) => ({
        sessionId: state.sessionId,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps
      })
    }
  )
)
```

### Form Validation Schemas

```typescript
// schemas/onboarding.ts
import { z } from 'zod'

export const step1Schema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email()
})

export const step3Schema = z.object({
  businessName: z.string().min(4).max(50),
  businessEmail: z.string().email(),
  businessPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  physicalAddress: z.object({
    street: z.string(),
    city: z.string(),
    province: z.string(),
    postalCode: z.string(),
    country: z.string()
  }),
  industry: z.string(),
  vatNumber: z.string().optional()
})

// ... Additional schemas for each step
```

## Component Architecture

### Core Layout Structure

```typescript
// app/onboarding/layout.tsx
export default function OnboardingLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <NextTopLoader color="#2563eb" showSpinner={false} />
      <ProgressBar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>
    </div>
  )
}
```

### Step Component Template

```typescript
// components/onboarding/StepTemplate.tsx
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import debounce from 'lodash.debounce'

interface StepProps {
  stepNumber: number
  title: string
  subtitle?: string
  schema: ZodSchema
  onNext: (data: any) => void
  onBack: () => void
}

export function StepTemplate({
  stepNumber,
  title,
  subtitle,
  schema,
  onNext,
  onBack,
  children
}: StepProps) {
  const { formData, updateFormData, saveProgress } = useOnboardingStore()
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: formData,
    mode: 'onBlur'
  })

  // Auto-save on change
  const debouncedSave = useMemo(
    () => debounce(async (data) => {
      updateFormData(data)
      await saveProgress()
      toast.success('Progress saved', { duration: 1000 })
    }, 1000),
    []
  )

  useEffect(() => {
    const subscription = form.watch((data) => {
      debouncedSave(data)
    })
    return () => subscription.unsubscribe()
  }, [form.watch, debouncedSave])

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-lg text-gray-600">{subtitle}</p>
          )}
        </div>

        <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
          {children}
          
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={stepNumber === 1}
            >
              Back
            </Button>
            
            <Button type="submit">
              Continue
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
```

## Detailed Step Specifications

### Step 1: Welcome Screen
**Duration**: ~30 seconds  
**Purpose**: Set expectations and build excitement

#### Content
**Title**: "Benvenuto nel processo di scoperta White Boar"

**Message**: "Welcome to the White Boar Discovery Process. This isn't just about building a website; it's about defining your brand's unique place in the digital world. Over the next few minutes, we'll work together to define your brand and build a powerful strategy for your new online presence. Let's begin."

**Motivational Elements**:
- "Join 500+ Italian businesses"
- "Average completion time: 15 minutes"
- "Get your preview in 5 business days"

#### Questions

| # | Field | Type | Validation | Required | Help Text |
|---|-------|------|------------|----------|-----------|
| 1 | What is your name? | Text input | Min: 3, Max: 100 chars | Yes | |
| 2 | What is your email? | Email input | Valid email format | Yes | This email will be used to log you into our website and to send you notifications |

---

### Step 2: Email Verification
**Duration**: ~1 minute  
**Purpose**: Validate email and establish secure session

#### Questions

| # | Field | Type | Validation | Required | Help Text |
|---|-------|------|------------|----------|-----------|
| 3 | Enter verification code | 6 separate inputs | 6 digits | Yes | We have emailed a verification code to the email address you provided |

---

### Step 3: Business Basics
**Duration**: ~2 minutes  
**Purpose**: Gather essential business information

#### Questions

| # | Field | Type | Validation | Required | Help Text |
|---|-------|------|------------|----------|-----------|
| 4 | Business name | Text input | Min: 4, Max: 50 chars | Yes | This will be the business name on your new website |
| 5 | Business contact email | Email input | Valid email format | Yes | Customers will contact you via this email |
| 6 | Business phone | Phone input with country selector | Valid phone format | Yes | Customers will contact you via this phone number |
| 7 | Physical address | Address input with autocomplete | Valid address | Yes | Your business location for maps and local SEO |
| 8 | Industry | Searchable dropdown | From industries.json | Yes | Choose the industry that best describes your business |
| 9 | VAT Number (Partita IVA) | Text input | Valid VAT format | No | Optional: For invoice purposes |

---

### Step 4: Brand Definition
**Duration**: ~3 minutes  
**Purpose**: Define unique value proposition and competitive positioning

#### Questions

| # | Field | Type | Validation | Required | Help Text |
|---|-------|------|------------|----------|-----------|
| 10 | Your offer | Textarea | Min: 20, Max: 250 chars | Yes | Describe what you offer in one sentence that would appeal to a new customer |
| 11 | Main competitors | Up to 3 URL inputs | Valid URLs | Yes (min 1) | Links to competitor websites help us understand your market |
| 12 | What makes you unique? | Sentence completion | Min: 10 chars for text portion | Yes | Complete: "Unlike my competitors, my business offers the best [dropdown], which allows my clients to [text]" |

---

### Step 5: Customer Profile
**Duration**: ~2 minutes  
**Purpose**: Build detailed customer persona

#### Questions

| # | Field | Type | Left Label | Right Label | Required |
|---|-------|------|------------|-------------|----------|
| 13 | Customer attributes | 5 combined sliders | See below | See below | Yes |

**Slider Specifications**:
1. **Budget**: "Budget-Conscious" ← → "Premium"
2. **Style**: "Traditional" ← → "Modern"  
3. **Motivation**: "Seeks Practical Solutions" ← → "Seeks an Experience"
4. **Decision Making**: "Spontaneous" ← → "Researches Thoroughly"
5. **Loyalty**: "Price-Driven" ← → "Brand-Loyal"

---

### Step 6: Customer Needs
**Duration**: ~1 minute  
**Purpose**: Define problem-solution fit

#### Questions

| # | Field | Type | Validation | Required | Help Text |
|---|-------|------|------------|----------|-----------|
| 14 | Problem you solve | Text input | Min: 20, Max: 100 chars | Yes | What's the biggest problem your business solves for customers? |
| 15 | Customer delight | Text input | Min: 10, Max: 100 chars | Yes | Why would customers be thrilled after choosing you? |

---

### Step 7: Visual Inspiration
**Duration**: ~2 minutes  
**Purpose**: Gather aesthetic references

#### Questions

| # | Field | Type | Validation | Required | Help Text |
|---|-------|------|------------|----------|-----------|
| 16 | Website references | 2-3 URL inputs | Valid URLs | Yes (min 2) | Share 2-3 websites you admire visually |

---

### Step 8: Design Style Selection
**Duration**: ~1 minute  
**Purpose**: Choose overall design aesthetic

#### Questions

| # | Field | Type | Options | Required |
|---|-------|------|---------|----------|
| 17 | Design style | Image grid selection | 6 style options | Yes |

---

### Step 9: Image Style Selection
**Duration**: ~1 minute  
**Purpose**: Choose photography/imagery style

#### Questions

| # | Field | Type | Options | Required |
|---|-------|------|---------|----------|
| 18 | Image style | Image grid selection | 6 style options | Yes |

---

### Step 10: Color Palette
**Duration**: ~1 minute  
**Purpose**: Select brand colors

#### Questions

| # | Field | Type | Options | Required |
|---|-------|------|---------|----------|
| 19 | Color palette | Color palette selection | 6 palette options | Yes |

---

### Step 11: Website Structure
**Duration**: ~2 minutes  
**Purpose**: Define site architecture and goals

#### Questions

| # | Field | Type | Options | Required | Help Text |
|---|-------|------|---------|----------|-----------|
| 20 | Website sections | Multi-checkbox | About Us, Products and Services, Testimonials, Gallery, Events, Contact, Blog/News | Yes (min 1) | Select all sections you want on your website |
| 21 | Primary goal | Dropdown | Call/book, Contact form, Visit location, Purchase, Download, Other | Yes | What's the main action you want visitors to take? |
| 22 | Products or services? | Radio selection | Products/Services/Both | Conditional | Only if "Products and Services" selected in Q20 |
| 23 | List your offerings | Dynamic text inputs | 1-6 items | Conditional | Only if Q22 answered |

---

### Step 12: Business Assets
**Duration**: ~3 minutes  
**Purpose**: Collect existing brand materials

#### Questions

| # | Field | Type | Validation | Required | Help Text |
|---|-------|------|------------|----------|-----------|
| 24 | Logo upload | File upload | Image files, max 10MB | No | Upload your logo (PNG, JPG, SVG) |
| 25 | Business photos | Multi-file upload | Image files, max 50MB total | No | Upload photos of your business, products, or services |

---

### Step 13: Completion
**Duration**: ~30 seconds  
**Purpose**: Confirm submission and set expectations

**Message**: "Perfect! We have everything we need to create your custom website. Our team will analyze your information and prepare a preview tailored to attract your ideal customers and differentiate you from competitors."

**Key Information**:
- "Preview ready in 5 business days"
- "You'll receive an email when it's ready"
- "Payment only after you approve the preview"

## Key Implementation Files

### Supabase Service
```typescript
// services/supabase.ts
import { createClient } from '@supabase/supabase-js'

export class OnboardingService {
  static async saveProgress(sessionId: string, data: any, step: number) {
    const { error } = await supabase
      .from('onboarding_sessions')
      .update({
        form_data: data,
        current_step: step,
        last_activity: new Date().toISOString()
      })
      .eq('id', sessionId)
    
    if (error) throw error
  }
  
  static async loadSession(sessionId: string) {
    const { data, error } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (error) throw error
    return data
  }
  
  static async completeOnboarding(sessionId: string, formData: any) {
    const { error } = await supabase
      .from('onboarding_submissions')
      .insert({
        session_id: sessionId,
        email: formData.email,
        business_name: formData.businessName,
        form_data: formData
      })
    
    if (error) throw error
  }
}
```

### Analytics Service
```typescript
// services/analytics.ts
import { track } from '@vercel/analytics'

export class Analytics {
  static stepViewed(step: number, stepName: string) {
    track('onboarding_step_viewed', {
      step_number: step,
      step_name: stepName
    })
  }
  
  static stepCompleted(step: number, timeSpent: number) {
    track('onboarding_step_completed', {
      step_number: step,
      time_spent_seconds: timeSpent
    })
  }
  
  static fieldError(step: number, fieldName: string, error: string) {
    track('onboarding_field_error', {
      step_number: step,
      field_name: fieldName,
      error_message: error
    })
  }
  
  static onboardingCompleted(totalTime: number) {
    track('onboarding_completed', {
      total_time_minutes: Math.round(totalTime / 60)
    })
  }
}
```

## Performance Optimization

### Bundle Size Management
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  }
}
```

### Dynamic Imports
```typescript
const FileUpload = dynamic(
  () => import('@/components/onboarding/FileUpload'),
  { 
    loading: () => <Skeleton className="h-32" />,
    ssr: false 
  }
)
```

## Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deployment Checklist

### Pre-Launch
- [ ] All environment variables configured
- [ ] Supabase tables and RLS policies created
- [ ] Google Maps API key restricted to domain
- [ ] Analytics tracking verified
- [ ] Email templates configured
- [ ] Error monitoring active
- [ ] Performance testing completed
- [ ] Cross-browser testing done
- [ ] Mobile responsiveness verified
- [ ] GDPR consent flow tested

### Launch Day
- [ ] Database backups configured
- [ ] Monitoring dashboards active
- [ ] Support team briefed
- [ ] A/B tests configured
- [ ] Rate limiting enabled
- [ ] CDN caching configured

### Post-Launch
- [ ] Monitor completion rates
- [ ] Review drop-off analytics
- [ ] Collect user feedback
- [ ] Iterate based on data
- [ ] Performance optimization
- [ ] A/B test iterations

## Security Considerations

### Input Validation
- All inputs validated client and server-side
- SQL injection prevention via parameterized queries
- XSS prevention via React's built-in escaping
- File upload restrictions (type, size, virus scanning)

### Session Security
- HTTP-only cookies for session management
- CSRF tokens for state-changing operations
- Rate limiting on OTP requests
- Session expiration and renewal

### Data Protection
- GDPR compliance with explicit consent
- Data encryption at rest and in transit
- Regular security audits
- Minimal data retention policy

## Development Priorities

### Phase 1: Core Functionality (Week 1-2)
1. Basic form flow with all steps
2. Supabase integration
3. Session management
4. Email verification
5. Basic progress saving

### Phase 2: Enhanced UX (Week 3)
1. Progress indicators
2. Keyboard navigation
3. Auto-save functionality
4. Mobile optimization
5. Inline validation

### Phase 3: Polish & Analytics (Week 4)
1. Animations and transitions
2. Analytics tracking
3. Abandonment recovery
4. File upload functionality
5. Error handling

### Phase 4: Testing & Launch
1. Cross-browser testing
2. Performance optimization
3. A/B testing setup
4. Load testing
5. Production deployment

## Conclusion

This comprehensive specification provides everything needed to build a production-ready onboarding system for White Boar. The architecture prioritizes user experience, performance, and conversion optimization while maintaining security and compliance standards.

Expected outcomes:
- **25%+ completion rate** (vs 10-20% industry average)
- **<15 minute completion time**
- **40%+ mobile submissions**
- **Seamless session recovery**
- **GDPR compliant**
- **Production-ready scalability**