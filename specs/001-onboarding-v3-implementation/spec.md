# Feature Specification: Onboarding System v3

**Feature Branch**: `001-onboarding-v3-implementation`
**Created**: 2025-10-08
**Status**: Draft
**Input**: User description: "onboarding v3 implementation - base the specification on @context/onboarding-implementation-spec-v3.md"

**Visual Design Reference**: See `context/Visual design/onboarding-*.png` for UI mockups of each step

## Execution Flow (main)
```
1. Parse user description from Input
   → Feature: Multi-step onboarding form for "Fast & Simple" website package
2. Extract key concepts from description
   → Actors: Potential customers (Italian SMBs)
   → Actions: Complete 13-step form, verify email, upload files, submit, payment
   → Data: Personal info, business details, design preferences, assets, payment
   → Constraints: Mobile-friendly, <15 min completion, >25% conversion
3. For each unclear aspect:
   → All aspects clearly defined in source document
4. Fill User Scenarios & Testing section
   → Complete user journey: form submission after Step 12, then payment in Step 13
5. Generate Functional Requirements
   → All 13 steps with form submission before payment
6. Identify Key Entities
   → Sessions, Submissions, Analytics, Uploads, Payments
7. Run Review Checklist
   → No implementation details in requirements
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-10-08

- Q: When address autocomplete service fails or is unavailable, what should happen? → A: Fall back silently to manual entry without showing error
- Q: How long should unpaid submissions be retained before automatic deletion or archival? → A: 90 days from submission creation
- Q: What data protection standard should apply to stored personally identifiable information (PII)? → A: GDPR compliance (EU standard) - encryption at rest, right to deletion
- Q: How long after payment initiation should the system continue verifying payment status on user return? → A: 24 hours (same business day)
- Q: When offline changes conflict with server state during sync, how should conflicts be resolved? → A: Last write wins - timestamp determines which version to keep

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story

A small business owner in Italy wants to get a professional website quickly and affordably. They visit WhiteBoar's website, click "Start now!", and begin a guided 13-step onboarding process that captures everything needed to create their perfect website. The system collects their business information, understands their brand, gathers design preferences, and accepts visual assets. After completing Step 12, the system submits the form data and creates a submission record. The user then proceeds to Step 13 to complete payment. Upon successful payment, the submission is updated with payment information, and the user receives confirmation that their website preview will be ready in 5 business days.

### Acceptance Scenarios

1. **Given** a new visitor arrives at the onboarding page, **When** they complete all required fields in Step 1 (personal information), **Then** the system enables the Next button and allows progression to Step 2

2. **Given** a user enters their email in Step 1, **When** they reach Step 2, **Then** the system sends a 6-digit verification code to their email and requires verification before continuing

3. **Given** a user is midway through the onboarding (Step 6), **When** they close their browser and return later, **Then** the system restores their progress and allows them to continue from where they left off

4. **Given** a user completes Step 12 (business assets upload), **When** they click Next, **Then** the system validates all form data, creates a submission record with status "unpaid", and navigates to Step 13 (payment)

5. **Given** a user enters invalid data in any field, **When** they attempt to move to the next step, **Then** the system displays clear error messages and prevents progression until corrected

6. **Given** a user is on Step 8 (design style selection), **When** they click Back, **Then** the system saves their current selections and returns them to Step 7 with all previous data intact

7. **Given** a user uploads a logo in Step 12, **When** the upload completes, **Then** the system displays a preview thumbnail and allows them to delete and re-upload if desired

8. **Given** a user has been inactive for 7 days, **When** they try to access their session, **Then** the system expires the session and prompts them to start fresh

9. **Given** a user is on Step 13 (payment), **When** they submit valid payment information, **Then** the system processes the payment, updates the submission with payment details, sends confirmation email, and displays a thank-you page

10. **Given** a user's payment fails on Step 13, **When** the error occurs, **Then** the system displays a clear error message and allows the user to retry payment without losing the submission

11. **Given** a submission exists but payment has not been completed, **When** the user returns to their session, **Then** the system allows them to navigate directly to Step 13 to complete payment

### Edge Cases

- What happens when a user enters an email that's already been used in a previous onboarding?
  → System allows duplicate emails but creates separate sessions

- How does the system handle users who abandon at different steps?
  → Analytics track abandonment point; session remains recoverable for 7 days

- What happens if verification code expires (10 minutes)?
  → System notifies user and provides "Resend code" option

- How does the system prevent spam submissions?
  → Email verification required; max 5 verification attempts with 15-minute lockout

- What happens when a user uploads files larger than the limit?
  → System rejects upload before transmission and displays size limit message

- How does the system handle mobile users with poor connectivity?
  → Form saves progress locally; syncs to server when connection available

- What happens when a user selects "Other" for industry?
  → System displays an additional text field to capture custom industry

- What happens if payment fails on Step 13?
  → System displays error message and allows retry; submission record remains with unpaid status; session stays active

- What happens if a user closes the browser during payment processing?
  → System checks payment status on return; if succeeded, updates submission and shows thank-you page; if failed or pending, shows payment retry

- What happens if a user navigates back from Step 13 (payment) to previous steps?
  → System prevents backward navigation from Step 13 since submission is already created; user must complete or abandon payment

- What happens to submissions that never receive payment?
  → Submissions remain in "unpaid" status for 90 days; can be identified for follow-up; automatically deleted after 90-day retention period; session expires after 7 days but submission persists until retention limit

---

## Requirements *(mandatory)*

### Functional Requirements

**Session Management:**
- **FR-001**: System MUST create a unique session identifier when a user begins onboarding
- **FR-002**: System MUST preserve session data for 7 days from last activity
- **FR-003**: System MUST restore user progress when they return to an incomplete session
- **FR-004**: System MUST expire sessions after 7 days of inactivity
- **FR-005**: System MUST track session metadata (IP address, user agent, locale, timestamps)

**Step 1 - Personal Information** (see `context/Visual design/onboarding-01-personal-info.png`):
- **FR-006**: System MUST capture user's first name (2-50 characters)
- **FR-007**: System MUST capture user's last name (2-50 characters)
- **FR-008**: System MUST capture user's email address with format validation
- **FR-009**: System MUST enable Next button only when all required fields are valid

**Step 2 - Email Verification** (see `context/Visual design/onboarding-02-email-verification.png`):
- **FR-010**: System MUST send a 6-digit verification code to the provided email
- **FR-011**: System MUST display the target email address to the user
- **FR-012**: System MUST auto-advance cursor between digit input fields
- **FR-013**: System MUST auto-submit verification when all 6 digits are entered
- **FR-014**: System MUST enforce 60-second cooldown on resend requests
- **FR-015**: System MUST allow maximum 5 verification attempts before 15-minute lockout
- **FR-016**: System MUST expire verification codes after 10 minutes
- **FR-017**: System MUST provide visual feedback for invalid codes (shake animation)
- **FR-018**: System MUST display success confirmation before auto-navigation

**Step 3 - Business Basics** (see `context/Visual design/onboarding-03-business-details.png`):
- **FR-019**: System MUST capture business name (2-50 characters)
- **FR-020**: System MUST capture business contact email with validation
- **FR-021**: System MUST capture business phone with country code selection (default: +39 Italy)
- **FR-022**: System MUST integrate address autocomplete using location services
- **FR-023**: System MUST auto-fill all address fields (street, city, province, postal code, country) from autocomplete selection
- **FR-024**: System MUST allow manual editing of address fields after autocomplete
- **FR-147**: System MUST fall back silently to manual address entry when autocomplete service is unavailable (no error message displayed)
- **FR-025**: System MUST provide industry selection from predefined list
- **FR-026**: System MUST show custom industry text field when "Other" is selected
- **FR-027**: System MUST capture VAT number (optional, Italian format: IT + 11 digits)

**Step 4 - Brand Definition** (see `context/Visual design/onboarding-04-brand-definition.png`):
- **FR-028**: System MUST capture business description (50-500 characters) with live character counter
- **FR-029**: System MUST allow users to add up to 3 competitor website URLs
- **FR-030**: System MUST validate URLs on blur (focus loss)
- **FR-031**: System MUST provide edit and delete actions for each competitor URL
- **FR-032**: System MUST capture competitive differentiation description (optional, max 400 characters)

**Step 5 - Customer Profile** (see `context/Visual design/onboarding-05-customer-profile.png`):
- **FR-033**: System MUST capture customer budget preference (0-100 slider, default 50)
- **FR-034**: System MUST capture customer style preference (0-100 slider, default 50)
- **FR-035**: System MUST capture customer purchase motivation (0-100 slider, default 50)
- **FR-036**: System MUST capture customer decision-making style (0-100 slider, default 50)
- **FR-037**: System MUST capture customer brand loyalty (0-100 slider, default 50)
- **FR-038**: System MUST provide descriptive labels at both ends of each slider
- **FR-039**: System MUST display current value during slider interaction

**Step 6 - Customer Needs** (see `context/Visual design/onboarding-06-customer-needs.png`):
- **FR-040**: System MUST capture customer problems being solved (30-400 characters)
- **FR-041**: System MUST capture customer delight factors (optional, max 400 characters)
- **FR-042**: System MUST display character counters for both text areas

**Step 7 - Visual Inspiration** (see `context/Visual design/onboarding-07-visual-inspiration.png`):
- **FR-043**: System MUST require minimum 2 website reference URLs
- **FR-044**: System MUST allow maximum 3 website reference URLs
- **FR-045**: System MUST validate URL format for all references
- **FR-046**: System MUST provide add, edit, and delete actions for reference URLs

**Step 8 - Design Style Selection** (see `context/Visual design/onboarding-08-design-style.png`):
- **FR-047**: System MUST display 6 design style options (minimalist, corporate, bold, playful, editorial, retro)
- **FR-048**: System MUST show visual preview for each design style
- **FR-049**: System MUST allow selection of exactly 1 design style
- **FR-050**: System MUST display descriptive tags for each style option

**Step 9 - Image Style Selection** (see `context/Visual design/onboarding-09-image-style.png`):
- **FR-051**: System MUST display 6 image style options (photorealistic, flat-illustration, line-art, sketch, collage, 3d)
- **FR-052**: System MUST show visual preview for each image style
- **FR-053**: System MUST allow selection of exactly 1 image style

**Step 10 - Color Palette Selection** (see `context/Visual design/onboarding-10-color-palette.png`):
- **FR-054**: System MUST display 6 predefined color palettes
- **FR-055**: System MUST show color swatches for each palette (primary, secondary, accent, background, text)
- **FR-056**: System MUST allow selection of exactly 1 color palette

**Step 11 - Website Structure** (see `context/Visual design/onboarding-11-website-structure.png`):
- **FR-057**: System MUST display website section checkboxes (About, Services/Products, Portfolio, Contact, Testimonials, Events)
- **FR-058**: System MUST require selection of at least 1 website section
- **FR-059**: System MUST capture primary website goal (generate calls, collect forms, drive visits, sell products, other)
- **FR-060**: System MUST show offering type selection (products, services, both) when Services/Products section is selected
- **FR-061**: System MUST allow users to list 1-6 specific offerings when applicable
- **FR-062**: System MUST provide add and delete actions for offerings list

**Step 12 - Business Assets Upload** (see `context/Visual design/onboarding-12-business-assets.png`):
- **FR-063**: System MUST allow logo upload (optional, max 10MB, PNG/JPG/SVG)
- **FR-064**: System MUST allow business photos upload (optional, max 30 files, 10MB each)
- **FR-065**: System MUST support drag-and-drop file upload
- **FR-066**: System MUST support click-to-browse file selection
- **FR-067**: System MUST display upload progress for each file
- **FR-068**: System MUST generate thumbnail previews after successful upload
- **FR-069**: System MUST allow deletion of uploaded files before submission
- **FR-070**: System MUST track total storage used across all uploads

**Step 12 to 13 Transition - Form Submission:**
- **FR-116**: System MUST validate all form data from Steps 1-12 when user clicks Next on Step 12
- **FR-117**: System MUST create a submission record with status "unpaid" after Step 12 validation succeeds
- **FR-118**: System MUST store submission ID in the session after creating submission
- **FR-119**: System MUST prevent navigation back to Steps 1-12 once submission is created
- **FR-120**: System MUST navigate to Step 13 (payment) only after submission is successfully created

**Step 13 - Payment** (visual design pending):
- **FR-121**: System MUST display payment amount (€40/month subscription)
- **FR-122**: System MUST integrate secure payment processing
- **FR-123**: System MUST collect payment card information securely
- **FR-124**: System MUST validate payment information before processing
- **FR-125**: System MUST display loading state during payment processing
- **FR-126**: System MUST prevent duplicate payment submissions
- **FR-127**: System MUST update existing submission with payment transaction ID upon success
- **FR-128**: System MUST update submission status from "unpaid" to "paid" upon successful payment
- **FR-129**: System MUST handle payment failure with clear error messages
- **FR-130**: System MUST allow payment retry without creating duplicate submissions
- **FR-131**: System MUST verify payment status if user returns after closing browser
- **FR-149**: System MUST only verify payment status for 24 hours after payment initiation (same business day window)
- **FR-132**: System MUST store payment transaction ID, timestamp, and card last 4 digits in submission
- **FR-133**: System MUST disable Back button on Step 13 (submission already created)
- **FR-134**: System MUST complete onboarding ONLY after successful payment
- **FR-135**: System MUST display payment security indicators (SSL, badges)
- **FR-136**: System MUST support major credit/debit cards (Visa, Mastercard, American Express)

**Navigation & Progress:**
- **FR-071**: System MUST display progress indicator showing all 13 steps
- **FR-072**: System MUST indicate completed steps, current step, and upcoming steps
- **FR-073**: System MUST enable Back button on all steps except Step 1 and Step 13
- **FR-074**: System MUST enable Next button only when current step is valid
- **FR-075**: System MUST save current step data when Back button is clicked (no validation required)
- **FR-076**: System MUST validate current step data when Next button is clicked
- **FR-077**: System MUST display loading state during form submission
- **FR-078**: System MUST prevent double-submission during loading

**Data Persistence:**
- **FR-079**: System MUST save progress when user navigates between steps
- **FR-080**: System MUST persist data locally (browser storage)
- **FR-081**: System MUST sync data to server when online
- **FR-082**: System MUST handle offline mode gracefully
- **FR-083**: System MUST display save status indicator (saving, saved, error)
- **FR-148**: System MUST resolve offline/online sync conflicts using last-write-wins strategy based on timestamp

**Validation & Error Handling:**
- **FR-084**: System MUST validate fields when user leaves the field (on blur)
- **FR-085**: System MUST display field-level error messages below the field
- **FR-086**: System MUST scroll to first error when Next is clicked with invalid data
- **FR-087**: System MUST focus first invalid field after validation failure
- **FR-088**: System MUST clear error messages when user corrects the field
- **FR-089**: System MUST display helpful error messages in user's selected language

**Submission & Completion** (see `context/Visual design/onboarding-13-thank-you.png` for thank-you page):
- **FR-090**: System MUST create submission record with status "unpaid" after Step 12 validation succeeds
- **FR-091**: System MUST update submission status to "paid" after successful payment in Step 13
- **FR-092**: System MUST send confirmation email to user after successful payment
- **FR-093**: System MUST send notification to admin team after successful payment
- **FR-094**: System MUST display thank-you page with next steps after successful payment
- **FR-095**: System MUST include expected preview delivery timeline (5 business days)
- **FR-137**: System MUST include payment transaction ID in confirmation email
- **FR-138**: System MUST include payment receipt details in confirmation email
- **FR-139**: System MUST associate submission with original session for tracking
- **FR-140**: System MUST preserve unpaid submissions for 90 days from creation before automatic deletion
- **FR-150**: System MUST comply with GDPR requirements for all PII data (encryption at rest, right to deletion)

**Analytics & Tracking:**
- **FR-096**: System MUST track step view events (which step, when)
- **FR-097**: System MUST track step completion events (duration, when)
- **FR-098**: System MUST track field error events (field, error type)
- **FR-099**: System MUST track onboarding completion events (total time)
- **FR-100**: System MUST track abandonment events (exit step, session duration)
- **FR-101**: System MUST track session resume events (resume step, days since last activity)
- **FR-141**: System MUST track form submission events (when submission created after Step 12)
- **FR-142**: System MUST track payment initiation events (when user reaches Step 13)
- **FR-143**: System MUST track payment success events (transaction ID, amount)
- **FR-144**: System MUST track payment failure events (error type, reason)
- **FR-145**: System MUST track payment retry events (attempt number)
- **FR-146**: System MUST track unpaid submission follow-up for conversion analysis

**Accessibility & Usability:**
- **FR-102**: System MUST support keyboard navigation (Tab, Shift+Tab, Enter, Escape)
- **FR-103**: System MUST provide ARIA labels for all form inputs
- **FR-104**: System MUST announce errors to screen readers
- **FR-105**: System MUST maintain minimum 48px touch targets on mobile
- **FR-106**: System MUST display high contrast focus indicators
- **FR-107**: System MUST support both English and Italian languages
- **FR-108**: System MUST adapt layout for mobile devices (single column, bottom sheet selects)
- **FR-109**: System MUST support swipe gestures on mobile (swipe left/right between steps)

**Performance & Optimization:**
- **FR-110**: System MUST load initial step in under 1.8 seconds (LCP target)
- **FR-111**: System MUST minimize layout shift during load (CLS < 0.1)
- **FR-112**: System MUST respond to first user interaction within 100ms (FID target)
- **FR-113**: System MUST transition between steps in under 300ms
- **FR-114**: System MUST optimize images for web delivery (WebP format)
- **FR-115**: System MUST lazy-load heavy components (file upload, maps, image grids, payment)

### Key Entities *(include if feature involves data)*

- **Session**: Represents an active or expired onboarding attempt. Contains session ID, current step, email verification status, form data snapshot, submission ID (populated after Step 12), locale preference, IP address, user agent, activity timestamps, and expiration date. Each session can have multiple analytics events and file uploads but only one submission.

- **Submission**: Represents a completed onboarding form. Created immediately after Step 12 with status "unpaid". Contains all collected form data, business details, design preferences, submission timestamp, payment status (unpaid → paid), payment transaction ID (populated after successful payment), workflow status (unpaid → paid → preview_sent → completed), and references back to the original session. Unpaid submissions are retained for 90 days from creation before automatic deletion. All PII data must comply with GDPR requirements including encryption at rest and support for right to deletion.

- **Payment**: Represents a payment transaction attempt. Contains payment transaction ID, submission reference, payment method, amount (€40), currency (EUR), payment status (pending → succeeded → failed), payment timestamp, card last 4 digits, error details (if failed), and retry count. Multiple payment attempts can exist for one submission (retries), but only one successful payment.

- **Analytics Event**: Represents a tracked user behavior during onboarding. Contains event type (step_view, step_complete, field_error, form_submitted, payment_initiated, payment_succeeded, payment_failed, etc.), category (user_action, system_event, error, performance), step number, field name, duration, metadata, IP address, user agent, and timestamp. Associated with a session.

- **Upload**: Represents a file uploaded during Step 12. Contains file type (logo or photo), storage URL, original filename, file size, MIME type, image dimensions, upload status, security scan status, processing status, and timestamp. Associated with a session. Maximum 1 logo and 30 photos per session.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
