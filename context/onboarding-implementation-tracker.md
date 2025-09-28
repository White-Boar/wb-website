# White Boar Onboarding System Implementation Tracker

## 🚨 CRITICAL DEVELOPMENT PRINCIPLES

### Dev Server Management
- **NEVER** have more than one dev server running simultaneously
- Always terminate existing dev servers before starting new ones
- Use `pkill -f "pnpm dev"` to kill all dev servers if needed
- Prevents port conflicts, caching issues, and resource conflicts

### Playwright Testing
- **ALWAYS** clear localStorage when using Playwright to avoid test inconsistencies
- Onboarding flow uses localStorage persistence which causes auto-navigation to previous steps
- Tests must use fresh browser contexts with `storageState: undefined`
- Use `ensureFreshOnboardingState(page)` helper to ensure clean test state
- Use restart button functionality to reset state between test runs

### AI Agent Instructions
- **LISTEN CAREFULLY** to user instructions and follow them exactly
- **NEVER deviate** from explicit user requests without asking for permission
- **ASK FOR CONFIRMATION** before changing scope or approach
- **BREAK DOWN** complex requests and confirm each part before proceeding
- **FOCUS ONLY** on the specific task requested
- **SEQUENTIAL EXECUTION** - when asked to validate "ALL steps", go through each step 1→2→3→4... systematically

## 📋 OPEN TASKS

### Priority 1: E2E Test Failure Fix
**Current Issue**: E2E test failing at Step 8 due to store migration issues
- [ ] Fix store migration from nested `physicalAddress` to flattened fields
- [ ] Debug Step 8 design selection form state update
- [ ] Update test selectors from nested to flattened structure
- [ ] Verify complete 12-step flow works end-to-end
**Estimated Time**: 4-6 hours

### Priority 2: Translation Completion
**Status**: Functionality works, missing user-facing text
- [ ] Complete translation keys for Steps 4-5, 10+
- [ ] Add Italian translations for all new keys
- [ ] Implement fallback handling for missing keys
**Estimated Time**: 8-12 hours

### Priority 3: Production Deployment Preparation
- [ ] Production environment setup
- [ ] Database migration verification
- [ ] Configure production email templates
- [ ] Set up monitoring dashboard
- [ ] Security audit completion
**Estimated Time**: 8-12 hours

### Optional Tasks
- [ ] Edge case testing (session expiration, network failures)
- [ ] Cross-browser testing (Safari, Firefox, mobile browsers)
- [ ] Performance optimization final checks
**Estimated Time**: 10-14 hours total

## 📊 CURRENT STATUS

**Production Readiness**: 6/10 (Manual testing works, automated tests failing)
- ✅ Manual testing: Complete flow works via Playwright MCP
- ❌ E2E automation: Failing at Step 8 consistently
- ⚠️ Store architecture: Migration logic not working
- ⚠️ Translation coverage: ~70% complete

**Critical Blocker**: E2E test failure due to data structure mismatch between nested and flattened address fields in onboarding store.