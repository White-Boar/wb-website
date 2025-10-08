# Onboarding System Implementation Specification v3.0
## Complete Requirements & Implementation Guide

## Table of Contents
1. [Business Context](#1-business-context)
2. [Functional Requirements - All 12 Steps](#2-functional-requirements---all-12-steps)
3. [Interaction Design](#3-interaction-design)
4. [Technical Architecture](#4-technical-architecture)
5. [Implementation Patterns](#5-implementation-patterns)
6. [Testing Strategy](#6-testing-strategy)
7. [Performance & Optimization](#7-performance--optimization)

---

## 1. Business Context

### Product Overview
- **Target Market**: Italian Small and Medium Businesses (SMBs)
- **Service**: "Fast & Simple" website package
- **Pricing**: €40/month subscription
- **Model**: Preview-first approach (payment after approval)
- **Delivery**: 5 business days for preview

### Success Metrics
- **Completion Rate Target**: >25% (industry average: 10-20%)
- **Time to Complete**: <15 minutes
- **Mobile Completion**: >40%
- **Session Recovery Rate**: >80%
- **User Satisfaction**: >4.5/5

### User Journey
1. Arrive from marketing site/campaign
2. Complete 12-step onboarding process
3. Receive confirmation email
4. Wait 5 business days for preview
5. Review and approve preview
6. Complete payment
7. Website goes live

---

## 2. Functional Requirements - All 12 Steps

### Step 1: Welcome & Personal Information
**Purpose**: Capture user identity and create session

**UI Elements**:
```
┌─────────────────────────────────────────┐
│  Welcome to WhiteBoar                   │
│  Let's create your perfect website      │
│                                          │
│  First Name *                           │
│  [____________________]                 │
│                                          │
│  Last Name *                            │
│  [____________________]                 │
│                                          │
│  Email Address *                        │
│  [____________________]                 │
│                                          │
│  [Back] [Next →]                        │
└─────────────────────────────────────────┘
```

**Fields**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `firstName` | Text | 2-50 chars, letters + spaces + common punctuation | Yes |
| `lastName` | Text | 2-50 chars, letters + spaces + common punctuation | Yes |
| `email` | Email | Valid email format | Yes |

**Validation Messages**:
- "First name must be at least 2 characters"
- "Last name cannot exceed 50 characters"
- "Please enter a valid email address"

---

### Step 2: Email Verification
**Purpose**: Verify email ownership and prevent spam

**UI Elements**:
```
┌─────────────────────────────────────────┐
│  Verify Your Email                      │
│  We've sent a code to john@example.com  │
│                                          │
│  Enter 6-digit code:                    │
│  [_] [_] [_] [_] [_] [_]                │
│                                          │
│  Didn't receive? Resend code (0:45)     │
│                                          │
│  [← Back] [Verify →]                    │
└─────────────────────────────────────────┘
```

**Fields**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `verificationCode` | 6 digits | Exactly 6 numeric digits | Yes |

**Behavior**:
- Auto-advance between digit inputs (cursor moves to next field automatically)
- Auto-submit on 6th digit (form submits immediately when all 6 digits entered)
- 60-second cooldown on resend button (button disabled with countdown timer)
- Max 5 attempts before 15-minute lockout (prevents brute force attacks)
- Code expires after 10 minutes (security measure)
- Visual feedback: Invalid code shakes the input fields
- Success state: Green checkmark before auto-navigation

---

### Step 3: Business Basics
**Purpose**: Collect essential business information

**UI Elements**:
```
┌─────────────────────────────────────────┐
│  Tell Us About Your Business            │
│                                          │
│  Business Name *                        │
│  [____________________]                 │
│                                          │
│  Business Email *                       │
│  [____________________]                 │
│  ℹ Customers will contact you here      │
│                                          │
│  Business Phone *                       │
│  [+39 ▼] [_______________]             │
│                                          │
│  Business Address *                     │
│  [Start typing to search...]            │
│  📍 Google Places Autocomplete          │
│                                          │
│  Industry *                             │
│  [Select industry ▼]                    │
│                                          │
│  VAT Number (optional)                  │
│  [IT_______________]                    │
│                                          │
│  [← Back] [Next →]                      │
└─────────────────────────────────────────┘
```

**Fields**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `businessName` | Text | 2-50 chars | Yes |
| `businessEmail` | Email | Valid email | Yes |
| `businessPhone` | Phone | International format | Yes |
| `businessStreet` | Text | Via Google Places | Yes |
| `businessCity` | Text | Via Google Places | Yes |
| `businessProvince` | Text | Via Google Places | Yes |
| `businessPostalCode` | Text | 5 digits (Italian) | Yes |
| `businessCountry` | Text | Via Google Places | Yes |
| `businessPlaceId` | Hidden | Google Place ID | Auto |
| `industry` | Select | From industries.json | Yes |
| `customIndustry` | Text | If "Other" selected | Conditional |
| `vatNumber` | Text | IT + 11 digits | No |

---

### Step 4: Brand Definition
**Purpose**: Understand unique value proposition

**UI Elements**:
```
┌─────────────────────────────────────────┐
│  Define Your Brand                      │
│                                          │
│  Describe Your Business * (50-500)      │
│  [________________________]             │
│  [________________________]             │
│  [________________________]             │
│  Characters: 75/500                     │
│                                          │
│  Your Main Competitors (optional)       │
│  ┌─────────────────────────┐          │
│  │ https://competitor1.com │ [✏️] [🗑️]  │
│  └─────────────────────────┘          │
│  [+ Add Competitor] (2 remaining)       │
│                                          │
│  What Makes You Different? (optional)   │
│  [________________________]             │
│  [________________________]             │
│  Characters: 0/400                      │
│                                          │
│  [← Back] [Next →]                      │
└─────────────────────────────────────────┘
```

**Fields**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `businessDescription` | Textarea | 50-500 chars | Yes |
| `competitorUrls` | URL list | Valid URLs, max 3 | No |
| `competitorAnalysis` | Textarea | Max 400 chars | No |

**Dynamic List Behavior**:
- Start with 0 competitors shown
- "Add Competitor" adds input field
- Each URL validates on blur
- Edit icon enables inline editing
- Delete requires confirmation
- Drag to reorder

---

### Step 5: Customer Profile
**Purpose**: Define target audience characteristics

**UI Elements**:
```
┌─────────────────────────────────────────┐
│  Understand Your Customers              │
│                                          │
│  Budget Preference                      │
│  Budget-Conscious ●━━━━━━━━━○ Premium   │
│                    0    50    100       │
│                                          │
│  Style Preference                       │
│  Traditional ○━━━━━━●━━━━━━━○ Modern    │
│              0    50    100             │
│                                          │
│  Purchase Motivation                    │
│  Practical ○━━━━━━━━━━━●━━━○ Experience │
│            0    50    100               │
│                                          │
│  Decision Making                        │
│  Spontaneous ○━━━●━━━━━━━━━○ Research   │
│              0    50    100             │
│                                          │
│  Brand Loyalty                          │
│  Price-Driven ○━━━━━━━●━━━━○ Loyal      │
│               0    50    100            │
│                                          │
│  [← Back] [Next →]                      │
└─────────────────────────────────────────┘
```

**Fields**:
| Field | Type | Range | Default |
|-------|------|-------|---------|
| `customerProfile.budget` | Slider | 0-100 | 50 |
| `customerProfile.style` | Slider | 0-100 | 50 |
| `customerProfile.motivation` | Slider | 0-100 | 50 |
| `customerProfile.decisionMaking` | Slider | 0-100 | 50 |
| `customerProfile.loyalty` | Slider | 0-100 | 50 |

---

### Step 6: Customer Needs
**Purpose**: Identify problems solved and value delivered

**UI Elements**:
```
┌─────────────────────────────────────────┐
│  What Your Customers Need               │
│                                          │
│  What Problems Do You Solve? * (30-400) │
│  [________________________]             │
│  [________________________]             │
│  [________________________]             │
│  Characters: 0/400                      │
│                                          │
│  What Delights Your Customers?          │
│  [________________________]             │
│  [________________________]             │
│  Characters: 0/400                      │
│                                          │
│  [← Back] [Next →]                      │
└─────────────────────────────────────────┘
```

**Fields**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `customerProblems` | Textarea | 30-400 chars | Yes |
| `customerDelight` | Textarea | Max 400 chars | No |

---

### Step 7: Visual Inspiration
**Purpose**: Gather aesthetic preferences

**UI Elements**:
```
┌─────────────────────────────────────────┐
│  Share Your Vision                      │
│                                          │
│  Websites You Love (optional)           │
│  Share 2-3 sites that inspire you       │
│                                          │
│  ┌─────────────────────────┐          │
│  │ 🌐 https://example1.com │ [✏️] [🗑️]  │
│  └─────────────────────────┘          │
│  ┌─────────────────────────┐          │
│  │ 🌐 https://example2.com │ [✏️] [🗑️]  │
│  └─────────────────────────┘          │
│                                          │
│  [+ Add Website] (1 remaining)          │
│                                          │
│  [← Back] [Next →]                      │
└─────────────────────────────────────────┘
```

**Fields**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `websiteReferences` | URL list | Valid URLs, 2-3 items | Yes (min 2) |

**Notes**:
- Minimum 2 URLs required to ensure adequate visual references
- Maximum 3 URLs to keep response focused
- Each URL validated for proper format on blur

---

### Step 8: Design Style Selection
**Purpose**: Choose overall aesthetic direction

**UI Elements**:
```
┌─────────────────────────────────────────┐
│  Choose Your Design Style               │
│                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ MINIMAL │ │CORPORATE│ │  BOLD   │  │
│  │ ░░░░░░░ │ │ ▓▓▓▓▓▓▓ │ │ ██████  │  │
│  │ ░░░░░░░ │ │ ▓▓▓▓▓▓▓ │ │ ██████  │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│   □ Select    □ Select    □ Select     │
│                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ PLAYFUL │ │EDITORIAL│ │  RETRO  │  │
│  │ ◯◯◯◯◯◯◯ │ │ ═══════ │ │ ▲▲▲▲▲▲  │  │
│  │ ◯◯◯◯◯◯◯ │ │ ═══════ │ │ ▲▲▲▲▲▲  │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│   □ Select    □ Select    □ Select     │
│                                          │
│  [← Back] [Next →]                      │
└─────────────────────────────────────────┘
```

**Options**:
| Style | Description | Tags |
|-------|-------------|------|
| `minimalist` | Clean, whitespace, sophisticated | Clean, Simple, Professional |
| `corporate` | Professional, trustworthy | Trustworthy, Structured |
| `bold` | Dynamic, vibrant colors | Dynamic, Artistic |
| `playful` | Fun, engaging elements | Fun, Friendly |
| `editorial` | Magazine-style layout | Content-focused |
| `retro` | Vintage, nostalgic | Classic, Nostalgic |

---

### Step 9: Image Style Selection
**Purpose**: Define visual content style

**UI Elements**:
```
┌─────────────────────────────────────────┐
│  Select Your Image Style                │
│                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  PHOTO  │ │  FLAT   │ │  LINE   │  │
│  │ 📷 Real │ │ 🎨 Flat │ │ ✏️ Art  │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│   □ Select    □ Select    □ Select     │
│                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ SKETCH  │ │ COLLAGE │ │   3D    │  │
│  │ ✍️ Hand │ │ 🎭 Mix  │ │ 🎲 3D   │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│   □ Select    □ Select    □ Select     │
│                                          │
│  [← Back] [Next →]                      │
└─────────────────────────────────────────┘
```

**Options**:
| Style | Description |
|-------|-------------|
| `photorealistic` | Real photography |
| `flat-illustration` | Modern flat graphics |
| `line-art` | Simple line drawings |
| `sketch` | Hand-drawn style |
| `collage` | Mixed media approach |
| `3d` | 3D rendered graphics |

---

### Step 10: Color Palette Selection
**Purpose**: Choose brand colors

**UI Elements**:
```
┌─────────────────────────────────────────┐
│  Pick Your Color Palette                │
│                                          │
│  ┌─────────────────────────┐          │
│  │ Palette 1 - Professional │          │
│  │ ■ ■ ■ ■ ■                │          │
│  └─────────────────────────┘          │
│   □ Select                              │
│                                          │
│  ┌─────────────────────────┐          │
│  │ Palette 2 - Vibrant      │          │
│  │ ■ ■ ■ ■ ■                │          │
│  └─────────────────────────┘          │
│   □ Select                              │
│                                          │
│  (4 more palettes...)                   │
│                                          │
│  [← Back] [Next →]                      │
└─────────────────────────────────────────┘
```

**Options**: 6 pre-designed color palettes with:
- Primary color
- Secondary color
- Accent color
- Background colors
- Text colors

---

### Step 11: Website Structure
**Purpose**: Plan site architecture and goals

**UI Elements**:
```
┌─────────────────────────────────────────┐
│  Plan Your Website                      │
│                                          │
│  Select Website Sections *              │
│  ☑ About Us                            │
│  ☐ Services/Products                   │
│  ☐ Portfolio/Gallery                   │
│  ☑ Contact                             │
│  ☐ Testimonials                        │
│  ☐ Events                              │
│                                          │
│  Primary Website Goal *                 │
│  [Select goal ▼]                        │
│  • Generate phone calls                 │
│  • Collect contact forms                │
│  • Drive store visits                   │
│  • Sell products online                 │
│  • Other                                │
│                                          │
│  What Do You Offer? (if Services)       │
│  ○ Products ○ Services ○ Both           │
│                                          │
│  List Your Offerings (if applicable)    │
│  1. [___________________] [×]          │
│  2. [___________________] [×]          │
│  [+ Add Offering] (4 remaining)         │
│                                          │
│  [← Back] [Next →]                      │
└─────────────────────────────────────────┘
```

**Fields**:
| Field | Type | Validation | Required |
|-------|------|------------|----------|
| `websiteSections` | Multi-check | Min 1 section | Yes |
| `primaryGoal` | Select | From list | Yes |
| `offeringType` | Radio | If services selected | Conditional |
| `offerings` | Text list | 1-6 items | Conditional |

---

### Step 12: Business Assets Upload
**Purpose**: Collect visual materials

**UI Elements**:
```
┌─────────────────────────────────────────┐
│  Upload Your Business Assets            │
│                                          │
│  Logo (optional)                        │
│  ┌─────────────────────────┐          │
│  │                          │          │
│  │    📤 Drop logo here     │          │
│  │    or click to browse    │          │
│  │                          │          │
│  └─────────────────────────┘          │
│  PNG, JPG, SVG • Max 10MB               │
│                                          │
│  Business Photos (optional)             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│  │ 📷 │ │ 📷 │ │ 📷 │ │ +  │         │
│  └────┘ └────┘ └────┘ └────┘         │
│  3 of 30 photos • 15MB used             │
│                                          │
│  [← Back] [Complete →]                  │
└─────────────────────────────────────────┘
```

**Fields**:
| Field | Type | Limits | Required |
|-------|------|--------|----------|
| `logoUpload` | File | 10MB, PNG/JPG/SVG | No |
| `businessPhotos` | Files | 30 files, 10MB each | No |

---

## 3. Interaction Design

### Navigation Patterns

#### Back Button
- **State**: Always visible except Step 1
- **Action**: Saves current data, no validation
- **Transition**: Slide right animation
- **Keyboard**: Alt+Left Arrow

#### Next Button
- **States**:
  - Disabled: Gray background, cursor-not-allowed
  - Enabled: Primary color, hover effect
  - Loading: Spinner icon, disabled
- **Validation**: Triggers on click
- **Success**: Brief checkmark → navigate
- **Error**: Shake animation, show errors
- **Keyboard**: Enter key when enabled

#### Progress Bar
```
[●]━[●]━[●]━[○]━[○]━[○]━[○]━[○]━[○]━[○]━[○]━[○]
 1   2   3   4   5   6   7   8   9   10  11  12
```
- Completed: Filled circle with checkmark
- Current: Filled circle with pulse
- Upcoming: Empty circle
- Clickable: Only completed steps

### Form Field Interactions

#### Text Inputs
**States**:
- Default: Gray border
- Focus: Blue border, elevated shadow
- Valid: Green checkmark icon
- Error: Red border, error icon
- Disabled: Gray background

**Behavior**:
- Focus: Smooth border transition (200ms)
- Type: Remove error after valid input
- Blur: Validate and show error if invalid
- Paste: Accept and validate

#### Email Inputs
**Additional Features**:
- Email format validation on blur
- Suggest common domains on typo
- Lowercase transformation

#### Phone Input
**Features**:
- Country code dropdown
- Format as typing
- International validation
- Default to Italy (+39)

#### Address Autocomplete
**Google Places Integration**:
1. Focus → Show recent/nearby suggestions
2. Type → Filter suggestions in real-time
3. Select → Auto-fill all address fields
4. Manual edit allowed after selection

#### Dropdowns/Selects
**Behavior**:
- Click → Open with fade animation
- Type → Filter options (searchable)
- Arrow keys → Navigate options
- Enter → Select highlighted
- Escape → Close without selection

#### Sliders
**Interaction**:
- Click track → Jump to position
- Drag handle → Smooth movement
- Arrow keys → ±1 increment
- Shift+Arrow → ±10 increment
- Tooltip shows value during interaction

#### Dynamic Lists (URLs, Competitors, Offerings)
**Add Item**:
1. Click "Add" button
2. New input slides down
3. Auto-focus new field
4. Validate on blur

**Edit Item**:
1. Click edit icon
2. Input becomes editable
3. Show save/cancel buttons
4. ESC cancels, Enter saves

**Remove Item**:
1. Hover → Show trash icon
2. Click → Confirmation dialog
3. Confirm → Slide up animation
4. Update remaining count

**Reorder** (if applicable):
1. Drag handle on left
2. Drag to new position
3. Drop with smooth transition

#### File Upload
**Drag & Drop**:
- Normal: Dashed border
- Drag over: Solid blue border
- Drop: Upload progress bar

**Click to Browse**:
- Open native file picker
- Filter by accepted types
- Multi-select for photos

**Upload Progress**:
- Individual progress bars
- Success: Green checkmark
- Error: Red X with retry

**Preview**:
- Thumbnail generation
- Click to enlarge
- Delete with confirmation

### Validation & Errors

#### Field-Level Validation
**Timing**:
- On blur for most fields
- On change for critical fields (email)
- Debounced for expensive operations

**Display**:
```
[Input Field with Red Border     ]
⚠️ Error message appears here
```

#### Form-Level Validation
**Next Button Click**:
1. Validate all fields
2. Scroll to first error
3. Focus first invalid field
4. Show all error messages

#### Error Recovery
- Type to clear error
- Helpful suggestions
- Link to help docs

### Auto-Save Behavior

#### Save Triggers
- 2 seconds after last change
- Before navigation
- On window blur
- Every 30 seconds if dirty

#### Save Indicator
```
Saving...   → Spinner icon
Saved ✓     → Green checkmark (1s)
Error ⚠️     → Red with retry
```

### Mobile Adaptations

#### Touch Targets
- Minimum 48px height
- 16px padding on inputs
- Larger buttons (56px)

#### Layout Changes
- Single column
- Full-width inputs
- Bottom sheet for selects
- Sticky nav buttons

#### Gestures
- Swipe left/right between steps
- Pull to refresh
- Pinch to zoom on images

### Accessibility Features

#### Keyboard Navigation
- Tab: Next field
- Shift+Tab: Previous field
- Enter: Submit/Next
- Escape: Close modals
- Arrow keys: Options

#### Screen Readers
- ARIA labels on all inputs
- Live regions for updates
- Error announcements
- Progress updates

#### Visual Accessibility
- High contrast mode
- Focus indicators
- Error colors beyond red
- Text alternatives

---

## 4. Technical Architecture

### Development Principles

These principles guide all implementation decisions and are extracted from analyzing common pitfalls in multi-step form implementations:

1. **Single Source of Truth**
   - React Hook Form owns ALL form data and validation
   - Zustand stores ONLY: `currentStep`, `sessionId`, `lastSaved` metadata
   - NO data duplication between RHF and Zustand
   - NO manual validation that duplicates Zod schemas

2. **Validate Once, In One Place**
   - React Hook Form + Zod is the ONLY validation system
   - NO custom `validateStep()` functions
   - NO manual field checks at submission
   - Trust the framework's validation lifecycle

3. **Explicit State Transitions**
   - User clicks "Next" → navigate
   - NO auto-save on every keystroke
   - NO auto-navigation after operations
   - User controls the flow

4. **Load Once, Save on Intent**
   - Load persisted data on mount
   - Save ONLY when user clicks "Next" or "Back"
   - NO continuous sync between RHF ↔ Zustand ↔ localStorage
   - NO debounced auto-save

5. **Data Shape Consistency**
   - ONE data structure everywhere (no flat AND nested)
   - Use nested objects for related fields (e.g., `physicalAddress.street`)
   - NO fallback chains like `formData?.businessStreet ?? formData?.physicalAddress?.street`

6. **Fail Fast, Fail Loud**
   - Use error boundaries for React errors
   - Use toast notifications for user-facing errors
   - NO silent failures or console.log-only errors
   - NO production console.logs

7. **Test Behavior, Not Implementation**
   - Test what users do, not how components work internally
   - Playwright tests should match real user flows
   - NO testing internal state transitions

8. **Progressive Enhancement**
   - Start with simple implementation
   - Add complexity ONLY when proven necessary
   - NO over-engineered solutions upfront

9. **Delete First, Build Second**
   - Remove workarounds before adding features
   - Clean implementation beats patched code
   - If you need a workaround, the architecture is wrong

10. **Optimize for Change**
    - Small, independent components
    - Clear interfaces between layers
    - Easy to modify without breaking unrelated code

### Core Architecture Rules

1. **Form State Management**
   - React Hook Form is the source of truth
   - `mode: 'onBlur'` (NOT 'onChange')
   - `shouldUnregister: false` (keep data between steps)
   - ZERO manual `trigger()` calls

2. **Session State Management**
   - Zustand stores metadata ONLY
   - Persistence via Zustand middleware
   - NO form data in Zustand

3. **Clean Separation**
   - UI components (presentation)
   - Form logic (React Hook Form)
   - Business logic (services)
   - Metadata state (Zustand)

### Directory Structure
```
src/
├── app/[locale]/onboarding/
│   ├── layout.tsx                      # Layout wrapper
│   ├── page.tsx                        # Welcome/landing
│   └── step/
│       └── [stepNumber]/
│           └── page.tsx                # Step controller
│
├── components/onboarding/
│   ├── providers/
│   │   └── OnboardingFormProvider.tsx  # FormProvider setup
│   ├── form-fields/
│   │   ├── FormField.tsx              # Universal wrapper
│   │   ├── TextInput.tsx              # Text input
│   │   ├── EmailInput.tsx             # Email input
│   │   ├── PhoneInput.tsx             # Phone with country
│   │   ├── AddressInput.tsx           # Google Places
│   │   ├── SelectInput.tsx            # Dropdown
│   │   ├── SliderInput.tsx            # Range slider
│   │   ├── DynamicList.tsx            # Add/remove items
│   │   ├── ImageGrid.tsx              # Image selection
│   │   └── FileUpload.tsx             # Drag & drop
│   ├── steps/
│   │   ├── index.tsx                  # Step registry
│   │   ├── Step1Welcome.tsx           # Personal info
│   │   ├── Step2EmailVerification.tsx # OTP verification
│   │   └── ... (all 12 steps)
│   └── ui/
│       ├── StepNavigation.tsx         # Back/Next buttons
│       ├── ProgressBar.tsx            # Visual progress
│       ├── StepContainer.tsx          # Step wrapper
│       └── AutoSaveIndicator.tsx      # Save status
│
├── hooks/onboarding/
│   ├── useOnboardingForm.ts           # Form setup
│   ├── useStepNavigation.ts           # Navigation logic
│   ├── useSessionManagement.ts        # Session handling
│   ├── useAutoSave.ts                 # Auto-save logic
│   └── useStepValidation.ts           # Validation helpers
│
├── stores/
│   └── onboarding.ts                  # Zustand store
│
├── schemas/onboarding/
│   ├── index.ts                       # Combined schemas
│   ├── step1.schema.ts                # Personal info
│   ├── step2.schema.ts                # Verification
│   └── ... (all 12 schemas)
│
├── services/onboarding/
│   ├── client.ts                      # Client-side API
│   ├── server.ts                      # Server actions
│   └── supabase.ts                    # Database layer
│
├── types/
│   └── onboarding.ts                  # TypeScript types
│
└── lib/
    ├── constants.ts                   # Config values
    └── utils.ts                       # Helper functions
```

### Database Schema

The onboarding system uses 4 main tables in Supabase (PostgreSQL):

#### Table: `onboarding_sessions`
Active onboarding sessions with form progress and email verification.

**Columns:**
| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | Unique session identifier |
| `email` | text | UNIQUE, nullable | - | User's email address |
| `email_verified` | boolean | nullable | `false` | Email verification status |
| `verification_code` | text | nullable | - | Temporary OTP code for email verification |
| `verification_attempts` | integer | nullable | `0` | Number of failed verification attempts |
| `verification_locked_until` | timestamptz | nullable | - | Timestamp when verification attempts can resume |
| `current_step` | integer | nullable, CHECK (1-13) | `1` | Current step in onboarding flow |
| `form_data` | jsonb | - | `'{}'` | JSONB storage for progressive form data across all steps |
| `locale` | text | nullable | `'en'` | User's selected language (en/it) |
| `ip_address` | inet | nullable | - | Session IP address for analytics |
| `user_agent` | text | nullable | - | Browser user agent string |
| `last_activity` | timestamptz | nullable | `now()` | Last interaction timestamp |
| `expires_at` | timestamptz | nullable | `now() + 7 days` | Session expiration timestamp |
| `created_at` | timestamptz | nullable | `now()` | Session creation timestamp |
| `updated_at` | timestamptz | nullable | `now()` | Last update timestamp |

**Indexes:**
- Primary key on `id`
- Unique index on `email`
- Index on `expires_at` (for cleanup queries)

**RLS:** Enabled

---

#### Table: `onboarding_submissions`
Completed onboarding forms ready for processing.

**Columns:**
| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | Unique submission identifier |
| `session_id` | uuid | FOREIGN KEY → onboarding_sessions(id) | - | Reference to original session |
| `email` | text | NOT NULL | - | Business contact email |
| `business_name` | text | NOT NULL | - | Business name from form |
| `form_data` | jsonb | NOT NULL | - | Complete form data from all steps |
| `status` | text | CHECK | `'submitted'` | Workflow status: submitted → preview_sent → paid → completed → cancelled |
| `completion_time_seconds` | integer | nullable | - | Total time from start to completion in seconds |
| `preview_sent_at` | timestamptz | nullable | - | When preview was sent to client |
| `preview_viewed_at` | timestamptz | nullable | - | When client viewed preview |
| `payment_completed_at` | timestamptz | nullable | - | When payment was received |
| `admin_notes` | text | nullable | - | Internal notes for processing team |
| `created_at` | timestamptz | nullable | `now()` | Submission timestamp |

**Status Flow:**
```
submitted → preview_sent → paid → completed
         ↓
    cancelled (any time)
```

**RLS:** Enabled

---

#### Table: `onboarding_analytics`
User behavior and conversion tracking events.

**Columns:**
| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | Unique event identifier |
| `session_id` | uuid | FOREIGN KEY → onboarding_sessions(id), nullable | - | Associated session |
| `event_type` | text | NOT NULL | - | Event identifier: step_view, step_complete, field_error, etc. |
| `category` | text | CHECK | `'user_action'` | Event category: user_action, system_event, error, performance |
| `step_number` | integer | nullable, CHECK (1-13) | - | Step number if applicable |
| `field_name` | text | nullable | - | Field name for field-level events |
| `duration_ms` | integer | nullable | - | Duration of event/action in milliseconds |
| `metadata` | jsonb | nullable | `'{}'` | Additional event-specific data |
| `ip_address` | inet | nullable | - | User's IP address |
| `user_agent` | text | nullable | - | Browser user agent |
| `created_at` | timestamptz | nullable | `now()` | Event timestamp |

**Common Event Types:**
- `onboarding_step_viewed`
- `onboarding_step_completed`
- `onboarding_field_error`
- `onboarding_completed`
- `onboarding_abandoned`
- `onboarding_session_resumed`

**RLS:** Enabled

---

#### Table: `onboarding_uploads`
File uploads associated with onboarding sessions.

**Columns:**
| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | uuid | PRIMARY KEY | `gen_random_uuid()` | Unique upload identifier |
| `session_id` | uuid | FOREIGN KEY → onboarding_sessions(id), nullable | - | Associated session |
| `file_type` | text | NOT NULL, CHECK | - | File category: 'logo' or 'photo' |
| `file_url` | text | NOT NULL | - | Public URL to uploaded file |
| `file_name` | text | NOT NULL | - | Original filename |
| `file_size` | integer | NOT NULL | - | File size in bytes |
| `mime_type` | text | NOT NULL | - | MIME type (image/png, etc.) |
| `width` | integer | nullable | - | Image width in pixels |
| `height` | integer | nullable | - | Image height in pixels |
| `upload_completed` | boolean | nullable | `true` | Upload success status |
| `virus_scan_status` | text | CHECK | `'pending'` | Security scan: pending, clean, infected, failed |
| `is_processed` | boolean | nullable | `false` | Whether file has been processed (resized, optimized) |
| `created_at` | timestamptz | nullable | `now()` | Upload timestamp |

**File Type Constraints:**
- `logo`: Max 1 per session, 2MB limit
- `photo`: Max 30 per session, 10MB limit each

**RLS:** Enabled

---

### Database Relationships

```
onboarding_sessions (1) ──→ (many) onboarding_analytics
                    (1) ──→ (1) onboarding_submissions
                    (1) ──→ (many) onboarding_uploads
```

**Foreign Key Cascades:**
- On session deletion: CASCADE (removes related analytics, uploads)
- On session deletion: RESTRICT for submissions (prevent data loss)

---

### Technology Stack

#### Core Dependencies
```json
{
  "react": "^19.0.0",
  "next": "^15.4.6",
  "react-hook-form": "^7.62.0",
  "zod": "^4.1.5",
  "@hookform/resolvers": "^5.2.1",
  "zustand": "^5.0.8",
  "typescript": "^5.8.4"
}
```

#### UI Libraries
```json
{
  "@radix-ui/react-*": "latest",
  "tailwindcss": "^3.4.17",
  "framer-motion": "^11.11.17",
  "lucide-react": "^0.460.0",
  "sonner": "^2.0.7"
}
```

#### Utilities
```json
{
  "lodash.debounce": "^4.0.8",
  "react-dropzone": "^14.3.8",
  "react-otp-input": "^3.1.1",
  "react-international-phone": "^4.6.0",
  "@react-google-maps/api": "^2.20.7"
}
```

---

## 5. Implementation Patterns

### Step Page Component (Correct Pattern)

```typescript
// app/[locale]/onboarding/step/[stepNumber]/page.tsx
'use client'

import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useParams } from 'next/navigation'
import { useOnboardingStore } from '@/stores/onboarding'
import { getStepComponent } from '@/components/onboarding/steps'
import { getStepSchema } from '@/schemas/onboarding'
import { StepNavigation } from '@/components/onboarding/StepNavigation'

export default function OnboardingStepPage() {
  const router = useRouter()
  const params = useParams()
  const stepNumber = parseInt(params.stepNumber as string)
  const locale = params.locale as string

  // Get metadata from Zustand (NOT form data)
  const {
    currentStep,
    sessionId,
    loadPersistedData,
    saveStepData,
    nextStep,
    previousStep
  } = useOnboardingStore()

  // Get schema for current step
  const schema = getStepSchema(stepNumber)

  // Setup React Hook Form - THIS IS THE SOURCE OF TRUTH
  const methods = useForm({
    mode: 'onBlur',              // ✅ Validate on blur, NOT onChange
    reValidateMode: 'onBlur',    // ✅ Re-validate on blur
    shouldUnregister: false,     // ✅ Keep data when unmounting
    criteriaMode: 'all',         // ✅ Show all errors
    resolver: zodResolver(schema),
    defaultValues: loadPersistedData(stepNumber) // Load from localStorage ONCE
  })

  const { handleSubmit, formState: { isValid, isSubmitting } } = methods

  // Handle Next button click
  const handleNext = async (data: any) => {
    // RHF already validated via zodResolver - no need to check again

    // Save to database/localStorage
    await saveStepData(stepNumber, data)

    // Update step counter in Zustand
    nextStep()

    // Navigate
    if (stepNumber < 12) {
      router.push(`/${locale}/onboarding/step/${stepNumber + 1}`)
    } else {
      // Final step - submit everything
      await submitOnboarding(sessionId, data)
      router.push(`/${locale}/onboarding/thank-you`)
    }
  }

  // Handle Back button click
  const handleBack = async () => {
    // Get current form data
    const currentData = methods.getValues()

    // Save before going back (no validation needed)
    await saveStepData(stepNumber, currentData)

    // Update step counter
    previousStep()

    // Navigate
    if (stepNumber > 1) {
      router.push(`/${locale}/onboarding/step/${stepNumber - 1}`)
    }
  }

  // Get step component dynamically
  const StepComponent = getStepComponent(stepNumber)

  return (
    <FormProvider {...methods}>
      <div className="max-w-4xl mx-auto">
        <StepComponent />

        <StepNavigation
          onNext={handleSubmit(handleNext)}
          onBack={handleBack}
          canGoNext={isValid && !isSubmitting}
          canGoBack={stepNumber > 1}
          isLoading={isSubmitting}
        />
      </div>
    </FormProvider>
  )
}
```

**Key Points:**
- ✅ `mode: 'onBlur'` - Only validate when user leaves field
- ✅ NO `watch()` syncing to Zustand
- ✅ NO manual `trigger()` calls
- ✅ Load persisted data ONCE on mount
- ✅ Save ONLY on navigation (Next/Back)
- ✅ RHF handles ALL validation via Zod

### Universal FormField Wrapper

```typescript
// form-fields/FormField.tsx
import { Controller, useFormContext } from 'react-hook-form'

interface FormFieldProps {
  name: string
  render: (field: any, fieldState: any) => ReactElement
  rules?: any
}

export function FormField({
  name,
  render,
  rules
}: FormFieldProps) {
  const { control } = useFormContext()

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const enhancedField = {
          ...field,
          error: fieldState.error?.message,
          invalid: fieldState.invalid,
        }
        return render(enhancedField, fieldState)
      }}
    />
  )
}
```

### Step Component Pattern (Correct)

```typescript
// components/onboarding/steps/Step3BusinessBasics.tsx
'use client'

import { Controller, useFormContext } from 'react-hook-form'
import { TextInput } from '../form-fields/TextInput'
import { EmailInput } from '../form-fields/EmailInput'
import { AddressAutocomplete } from '../form-fields/AddressAutocomplete'

export function Step3BusinessBasics() {
  // Access form context (provided by parent page)
  const { control } = useFormContext()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tell Us About Your Business</h2>

      {/* Business Name */}
      <Controller
        name="businessName"
        control={control}
        render={({ field, fieldState }) => (
          <TextInput
            {...field}
            label="Business Name"
            placeholder="Your company name"
            error={fieldState.error?.message}
            required
          />
        )}
      />

      {/* Business Email */}
      <Controller
        name="businessEmail"
        control={control}
        render={({ field, fieldState }) => (
          <EmailInput
            {...field}
            label="Business Email"
            placeholder="contact@business.com"
            error={fieldState.error?.message}
            helpText="Customers will contact you here"
            required
          />
        )}
      />

      {/* Physical Address */}
      <Controller
        name="physicalAddress"
        control={control}
        render={({ field, fieldState }) => (
          <AddressAutocomplete
            {...field}
            label="Business Address"
            placeholder="Start typing to search..."
            error={fieldState.error?.message}
            required
          />
        )}
      />

      {/* Additional fields... */}
    </div>
  )
}
```

**Key Points:**
- ✅ Use `Controller` for each field
- ✅ Access `control` from `useFormContext()`
- ✅ NO manual `onChange` that calls `trigger()`
- ✅ Pass `fieldState.error?.message` to show validation errors
- ✅ RHF handles validation automatically on blur

### Navigation Component (Correct)

```typescript
// components/onboarding/StepNavigation.tsx
'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface StepNavigationProps {
  onNext: () => void
  onBack: () => void
  canGoNext: boolean
  canGoBack: boolean
  isLoading: boolean
  nextLabel?: string
  backLabel?: string
}

export function StepNavigation({
  onNext,
  onBack,
  canGoNext,
  canGoBack,
  isLoading,
  nextLabel = 'Next',
  backLabel = 'Back'
}: StepNavigationProps) {
  return (
    <div className="flex justify-between items-center mt-8">
      {/* Back Button */}
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={!canGoBack || isLoading}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {backLabel}
      </Button>

      {/* Next Button */}
      <Button
        type="button"
        onClick={onNext}
        disabled={!canGoNext || isLoading}
      >
        {isLoading ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Processing...
          </>
        ) : (
          <>
            {nextLabel}
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  )
}
```

**Key Points:**
- ✅ Pure presentation component
- ✅ Receives `onNext` and `onBack` handlers from parent
- ✅ Parent (page component) handles `handleSubmit()` and navigation logic
- ✅ NO validation logic in this component
- ✅ NO router access in this component

### Data Persistence (Simplified - NO Auto-Save)

**DO NOT implement auto-save**. Save only on intentional navigation:

```typescript
// services/onboarding/persistence.ts

/**
 * Save step data to localStorage
 * Called ONLY when user clicks Next or Back
 */
export async function saveStepData(
  sessionId: string,
  stepNumber: number,
  data: any
): Promise<void> {
  const key = `wb-onboarding-${sessionId}`

  // Get existing data
  const existing = localStorage.getItem(key)
  const allData = existing ? JSON.parse(existing) : {}

  // Merge new step data
  const updated = {
    ...allData,
    ...data,
    _lastSaved: new Date().toISOString(),
    _currentStep: stepNumber
  }

  // Save to localStorage
  localStorage.setItem(key, JSON.stringify(updated))

  // Optionally: Also save to database for cross-device sync
  try {
    await fetch('/api/onboarding/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        data: updated,
        currentStep: stepNumber
      })
    })
  } catch (error) {
    console.error('Failed to sync to server:', error)
    // Continue - localStorage save succeeded
  }
}

/**
 * Load persisted data for a specific step
 * Called ONCE on step mount
 */
export function loadPersistedData(
  sessionId: string,
  stepNumber: number
): any {
  const key = `wb-onboarding-${sessionId}`
  const stored = localStorage.getItem(key)

  if (!stored) {
    return getDefaultValues(stepNumber)
  }

  const data = JSON.parse(stored)
  return extractStepData(data, stepNumber)
}

/**
 * Get default values for a step
 */
function getDefaultValues(stepNumber: number): any {
  // Return empty object with correct shape for each step
  switch (stepNumber) {
    case 1:
      return { firstName: '', lastName: '', email: '' }
    case 3:
      return {
        businessName: '',
        businessEmail: '',
        businessPhone: '',
        physicalAddress: {
          street: '',
          city: '',
          province: '',
          postalCode: '',
          country: 'Italy',
          placeId: ''
        },
        industry: '',
        vatNumber: ''
      }
    // ... other steps
    default:
      return {}
  }
}
```

**Key Points:**
- ✅ NO `watch()` + debounce
- ✅ NO auto-save on every keystroke
- ✅ Save ONLY on Next/Back button click
- ✅ Simple, predictable behavior
- ✅ User controls when data is saved

### Zustand Store (Metadata Only - NO Form Data)

```typescript
// stores/onboarding.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { saveStepData, loadPersistedData } from '@/services/onboarding/persistence'

interface OnboardingStore {
  // ONLY metadata - NO form data
  sessionId: string | null
  currentStep: number
  lastSaved: Date | null

  // Actions
  initializeSession: (locale: string) => Promise<void>
  nextStep: () => void
  previousStep: () => void
  saveStepData: (stepNumber: number, data: any) => Promise<void>
  loadPersistedData: (stepNumber: number) => any
  clearSession: () => void
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      sessionId: null,
      currentStep: 1,
      lastSaved: null,

      initializeSession: async (locale: string) => {
        // Create new session
        const response = await fetch('/api/onboarding/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale })
        })

        const { sessionId } = await response.json()

        set({
          sessionId,
          currentStep: 1,
          lastSaved: null
        })
      },

      nextStep: () => {
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 12)
        }))
      },

      previousStep: () => {
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1)
        }))
      },

      saveStepData: async (stepNumber: number, data: any) => {
        const { sessionId } = get()
        if (!sessionId) throw new Error('No session ID')

        await saveStepData(sessionId, stepNumber, data)

        set({ lastSaved: new Date() })
      },

      loadPersistedData: (stepNumber: number) => {
        const { sessionId } = get()
        if (!sessionId) return {}

        return loadPersistedData(sessionId, stepNumber)
      },

      clearSession: () => {
        const { sessionId } = get()
        if (sessionId) {
          localStorage.removeItem(`wb-onboarding-${sessionId}`)
        }

        set({
          sessionId: null,
          currentStep: 1,
          lastSaved: null
        })
      }
    }),
    {
      name: 'wb-onboarding-meta',
      partialize: (state) => ({
        sessionId: state.sessionId,
        currentStep: state.currentStep,
        // NO formData persisted here
      })
    }
  )
)
```

**Critical Changes:**
- ❌ **REMOVED** `formData` from Zustand state
- ❌ **REMOVED** `updateFormData()` action
- ❌ **REMOVED** duplicate validation logic
- ✅ **ADDED** `saveStepData()` that delegates to service
- ✅ **ADDED** `loadPersistedData()` that delegates to service
- ✅ Store only manages: `sessionId`, `currentStep`, `lastSaved`

### Common Anti-Patterns to AVOID

Based on analysis of failed implementations, these patterns MUST be avoided:

#### ❌ Anti-Pattern 1: Wrong RHF Mode
```typescript
// WRONG - causes validation on every keystroke
const form = useForm({
  mode: 'onChange',  // ❌ BAD
})

// CORRECT - validate on blur
const form = useForm({
  mode: 'onBlur',  // ✅ GOOD
})
```

#### ❌ Anti-Pattern 2: Manual Trigger Calls
```typescript
// WRONG - manual validation
<input
  {...field}
  onChange={(e) => {
    field.onChange(e)
    trigger('fieldName')  // ❌ BAD - never needed if mode is correct
  }}
/>

// CORRECT - RHF handles validation
<Controller
  name="fieldName"
  control={control}
  render={({ field }) => <input {...field} />}  // ✅ GOOD
/>
```

#### ❌ Anti-Pattern 3: Syncing RHF to Zustand
```typescript
// WRONG - continuous sync causes loops
useEffect(() => {
  const subscription = form.watch((data) => {
    updateFormData(data)  // ❌ BAD
  })
  return () => subscription.unsubscribe()
}, [])

// CORRECT - save only on navigation
const handleNext = async (data) => {
  await saveStepData(stepNumber, data)  // ✅ GOOD
  router.push(`/step/${stepNumber + 1}`)
}
```

#### ❌ Anti-Pattern 4: Duplicate Validation
```typescript
// WRONG - validating in multiple places
const handleNext = async (data) => {
  const isFormValid = await form.trigger()  // RHF validation
  const isStepValid = await validateStep(stepNumber)  // ❌ Duplicate

  if (!isFormValid || !isStepValid) return
}

// CORRECT - single validation via RHF + Zod
const handleNext = async (data) => {
  // If we're here, RHF + Zod already validated
  await saveStepData(stepNumber, data)  // ✅ GOOD
}
```

#### ❌ Anti-Pattern 5: Inconsistent Data Shapes
```typescript
// WRONG - flat AND nested fields
const schema = z.object({
  businessStreet: z.string(),  // ❌ Flat
  physicalAddress: z.object({
    street: z.string()  // ❌ Also nested? Pick ONE
  })
})

// CORRECT - consistent structure
const schema = z.object({
  physicalAddress: z.object({  // ✅ GOOD
    street: z.string(),
    city: z.string(),
    // ...
  })
})
```

#### ❌ Anti-Pattern 6: Auto-Navigation
```typescript
// WRONG - removes user control
setTimeout(async () => {
  await nextStep()
  router.push(`/step/${nextStepNumber}`)  // ❌ BAD
}, 1000)

// CORRECT - user clicks Next
<Button onClick={handleSubmit(handleNext)}>  // ✅ GOOD
  Next
</Button>
```

#### ❌ Anti-Pattern 7: Production Console.logs
```typescript
// WRONG - debug code in production
console.log('Form data:', data)  // ❌ BAD

// CORRECT - use error boundaries and toasts
try {
  await saveStepData(data)
  toast.success('Saved')  // ✅ GOOD
} catch (error) {
  toast.error('Failed to save')  // ✅ GOOD
}
```

---

## 6. Testing Strategy

### Unit Tests

```typescript
// __tests__/components/FormField.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm } from 'react-hook-form'

describe('FormField', () => {
  it('validates on blur', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <FormField
          name="email"
          render={(field) => (
            <input {...field} data-testid="email" />
          )}
        />
      </TestWrapper>
    )

    const input = screen.getByTestId('email')
    await user.type(input, 'invalid')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/valid email/)).toBeVisible()
    })
  })
})
```

### E2E Tests

```typescript
// __tests__/e2e/onboarding-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test('completes full flow', async ({ page }) => {
    // Step 1: Personal Info
    await page.goto('/onboarding/step/1')
    await page.fill('[name="firstName"]', 'John')
    await page.fill('[name="lastName"]', 'Doe')
    await page.fill('[name="email"]', 'john@example.com')

    // Verify Next button enables
    const nextButton = page.locator('button:has-text("Next")')
    await expect(nextButton).toBeEnabled()
    await nextButton.click()

    // Step 2: Email Verification
    await expect(page).toHaveURL('/onboarding/step/2')

    // Continue through all steps...
  })

  test('saves progress on refresh', async ({ page }) => {
    await page.goto('/onboarding/step/1')
    await page.fill('[name="firstName"]', 'Jane')

    await page.reload()

    const firstName = page.locator('[name="firstName"]')
    await expect(firstName).toHaveValue('Jane')
  })
})
```

---

## 7. Performance & Optimization

### Code Splitting

**Dynamic Imports for Heavy Components**:

```typescript
// Lazy load file upload component (reduces initial bundle)
const FileUpload = dynamic(
  () => import('@/components/onboarding/form-fields/FileUpload'),
  {
    loading: () => <Skeleton className="h-32" />,
    ssr: false  // Client-side only (uses browser File API)
  }
)

// Lazy load image grid (Step 8, 9, 10)
const ImageGrid = dynamic(
  () => import('@/components/onboarding/ImageGrid'),
  {
    loading: () => <div className="grid grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
    </div>
  }
)

// Lazy load address autocomplete (Google Maps heavy)
const AddressAutocomplete = dynamic(
  () => import('@/components/onboarding/AddressAutocomplete'),
  {
    loading: () => <Skeleton className="h-12" />,
    ssr: false  // Requires Google Maps API in browser
  }
)

// Lazy load OTP input (Step 2 only)
const OTPInput = dynamic(
  () => import('@/components/onboarding/OTPInput'),
  {
    loading: () => (
      <div className="flex gap-2">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-12" />)}
      </div>
    )
  }
)
```

**Benefits**:
- Initial bundle reduced by ~150KB
- Step-specific components only loaded when needed
- Skeleton loaders prevent layout shift
- SSR disabled for browser-only features

### Image Optimization
- Lazy load images
- WebP format with fallbacks
- Responsive sizes
- CDN delivery

### Bundle Size
- Tree shake unused components
- Minimize third-party deps
- Analyze with next-bundle-analyzer

### Caching Strategy
- Cache API responses
- LocalStorage for draft data
- SessionStorage for temp data
- Service Worker for offline

### Next.js Configuration

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,  // Optimize CSS delivery
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/avif', 'image/webp'],  // Modern formats first
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',  // Remove console.logs
  },
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        commons: {
          name: 'commons',
          chunks: 'all',
          minChunks: 2,
        },
      }
    }
    return config
  }
}
```

### Performance Targets
- **LCP** (Largest Contentful Paint): < 1.8s
- **CLS** (Cumulative Layout Shift): < 0.1
- **FID** (First Input Delay): < 100ms
- **TTI** (Time to Interactive): < 3.5s
- **Bundle Size**: < 200KB initial JS (gzipped)
- **Step Transition**: < 300ms

---

## 8. Services & Analytics

### Analytics Events Specification

Track user behavior throughout the onboarding flow:

```typescript
// services/analytics.ts
import { track } from '@vercel/analytics'

export class OnboardingAnalytics {
  /**
   * Track when a step is viewed
   */
  static stepViewed(stepNumber: number, stepName: string) {
    track('onboarding_step_viewed', {
      step_number: stepNumber,
      step_name: stepName,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Track when a step is completed
   */
  static stepCompleted(stepNumber: number, timeSpent: number) {
    track('onboarding_step_completed', {
      step_number: stepNumber,
      time_spent_seconds: timeSpent,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Track validation errors
   */
  static fieldError(stepNumber: number, fieldName: string, errorMessage: string) {
    track('onboarding_field_error', {
      step_number: stepNumber,
      field_name: fieldName,
      error_message: errorMessage,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Track when entire onboarding is completed
   */
  static onboardingCompleted(totalTime: number, sessionId: string) {
    track('onboarding_completed', {
      total_time_minutes: Math.round(totalTime / 60),
      session_id: sessionId,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Track when user abandons onboarding
   */
  static onboardingAbandoned(stepNumber: number, sessionDuration: number) {
    track('onboarding_abandoned', {
      last_step: stepNumber,
      session_duration_minutes: Math.round(sessionDuration / 60),
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Track when user returns to resume
   */
  static sessionResumed(stepNumber: number, daysSinceLastActivity: number) {
    track('onboarding_session_resumed', {
      resume_step: stepNumber,
      days_since_last_activity: daysSinceLastActivity,
      timestamp: new Date().toISOString()
    })
  }
}
```

**Key Events**:
1. `onboarding_step_viewed` - User lands on a step
2. `onboarding_step_completed` - User successfully navigates to next step
3. `onboarding_field_error` - Validation error occurs
4. `onboarding_completed` - Full flow completed
5. `onboarding_abandoned` - User leaves before completion
6. `onboarding_session_resumed` - User returns to continue

### Onboarding Service Implementation

```typescript
// services/onboarding-server.ts (Server Actions)
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveStepProgress(
  sessionId: string,
  stepNumber: number,
  data: any
) {
  const supabase = createClient()

  const { error } = await supabase
    .from('onboarding_sessions')
    .update({
      form_data: data,
      current_step: stepNumber,
      last_activity: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId)

  if (error) {
    console.error('Failed to save progress:', error)
    throw new Error('Failed to save your progress. Please try again.')
  }

  revalidatePath('/onboarding')
}

export async function loadSession(sessionId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('onboarding_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    console.error('Failed to load session:', error)
    return null
  }

  // Check if session expired
  if (new Date(data.expires_at) < new Date()) {
    return null
  }

  return data
}

export async function completeOnboarding(
  sessionId: string,
  formData: any
) {
  const supabase = createClient()

  // Insert into submissions table
  const { error: submissionError } = await supabase
    .from('onboarding_submissions')
    .insert({
      session_id: sessionId,
      email: formData.email,
      business_name: formData.businessName,
      form_data: formData,
      created_at: new Date().toISOString()
    })

  if (submissionError) {
    console.error('Failed to save submission:', submissionError)
    throw new Error('Failed to submit your onboarding. Please try again.')
  }

  // Mark session as completed
  const { error: sessionError } = await supabase
    .from('onboarding_sessions')
    .update({
      current_step: 13,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId)

  if (sessionError) {
    console.error('Failed to update session:', sessionError)
  }

  // TODO: Trigger email notification
  // TODO: Create preview request in queue

  revalidatePath('/onboarding')
}

export async function uploadFile(
  sessionId: string,
  file: File,
  fileType: 'logo' | 'photo'
) {
  const supabase = createClient()

  // Upload to Supabase Storage
  const fileName = `${sessionId}/${fileType}-${Date.now()}-${file.name}`
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('onboarding-assets')
    .upload(fileName, file)

  if (uploadError) {
    console.error('Failed to upload file:', uploadError)
    throw new Error('Failed to upload file. Please try again.')
  }

  // Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('onboarding-assets')
    .getPublicUrl(fileName)

  // Record in uploads table
  const { error: recordError } = await supabase
    .from('onboarding_uploads')
    .insert({
      session_id: sessionId,
      file_type: fileType,
      file_url: publicUrl,
      file_size: file.size,
      mime_type: file.type,
      created_at: new Date().toISOString()
    })

  if (recordError) {
    console.error('Failed to record upload:', recordError)
  }

  return publicUrl
}
```

**Service Features**:
- Server actions for secure database operations
- Automatic session expiration checking
- Error handling with user-friendly messages
- File upload with Supabase Storage integration
- Analytics event tracking integration points

---

## Summary

This specification provides a complete blueprint for implementing the WhiteBoar onboarding system from scratch.

### What This Spec Contains

1. **Functional Requirements**: All 12 steps with exact fields, validation rules, and UI layouts
2. **Interaction Design**: Every user interaction, animation, and state transition
3. **Technical Architecture**: Clean separation between RHF (form data) and Zustand (metadata)
4. **Development Principles**: 10 core principles extracted from analyzing failed implementations
5. **Implementation Patterns**: Correct patterns showing how to use RHF + Zod properly
6. **Anti-Patterns to Avoid**: Common mistakes that cause brittleness and bugs
7. **Testing Strategy**: Comprehensive unit and E2E test coverage
8. **Performance**: Optimization strategies for production

### Key Implementation Rules

**Form State Management:**
- React Hook Form is the ONLY source of truth for form data
- Use `mode: 'onBlur'` (NOT 'onChange')
- ZERO manual `trigger()` calls
- Load persisted data ONCE on mount
- Save ONLY when user clicks Next/Back

**Session State Management:**
- Zustand stores ONLY: `sessionId`, `currentStep`, `lastSaved`
- NO form data in Zustand
- NO validation logic in Zustand
- NO auto-save with `watch()` + debounce

**Validation:**
- React Hook Form + Zod is the ONLY validation system
- NO duplicate validation in Zustand
- NO manual field checks at Step 12
- Trust the framework

**User Experience:**
- NO auto-navigation (user controls flow)
- NO auto-save on every keystroke
- Explicit state transitions only
- User clicks button → action happens

### Success Criteria

This implementation will be considered successful when:

1. ✅ Adding a new field doesn't break unrelated steps
2. ✅ Tests pass consistently without flakiness
3. ✅ Build process completes without errors
4. ✅ NO manual `trigger()` calls in the codebase
5. ✅ NO console.logs in production code
6. ✅ NO workarounds or commented-out features
7. ✅ Development velocity is fast (not struggling with fixes)
8. ✅ Code is simple and easy to understand

The key to success is following React Hook Form's design philosophy, maintaining clean separation of concerns, and prioritizing simplicity over cleverness.