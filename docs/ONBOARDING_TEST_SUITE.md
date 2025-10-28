# Onboarding State Management & Restart Functionality Test Suite

## Overview

This test suite validates two critical aspects of the onboarding system:

1. **State Persistence**: Ensures user progress and form data are saved automatically and persist through page reloads
2. **Restart Functionality**: Verifies the restart button properly clears state and allows fresh starts

## Test Files Created

### 1. Comprehensive E2E Test
**File**: `src/__tests__/e2e/onboarding-state-management.spec.ts`

**Features Tested**:
- ✅ Form data auto-save during onboarding
- ✅ State persistence across page reloads
- ✅ Step progression tracking
- ✅ Restart button functionality
- ✅ Session expiration handling
- ✅ Cross-navigation state preservation
- ✅ Multiple restart cycles

### 2. Simplified Core Test
**File**: `src/__tests__/e2e/onboarding-state-simple.spec.ts`

**Features Tested**:
- ✅ Basic state persistence
- ✅ Restart functionality
- ✅ localStorage structure validation
- ✅ Critical reload behavior after restart

### 3. Manual Testing Guide
**File**: `manual-test-onboarding-state.md`

**Manual Test Cases**:
- State persistence during form filling
- Step progression preservation
- Restart functionality validation
- Navigation behavior testing
- Session expiration scenarios

## Running the Tests

### Automated Tests
```bash
# Run comprehensive test suite
npx playwright test src/__tests__/e2e/onboarding-state-management.spec.ts

# Run simplified core tests
npx playwright test src/__tests__/e2e/onboarding-state-simple.spec.ts

# Run specific test
npx playwright test src/__tests__/e2e/onboarding-state-simple.spec.ts --grep "state persistence"

# Run with browser visible
npx playwright test src/__tests__/e2e/onboarding-state-simple.spec.ts --headed
```

### Manual Testing
Follow the step-by-step guide in `manual-test-onboarding-state.md`

## Key Test Scenarios

### State Persistence Test Flow
1. **Start onboarding** → Fill form data
2. **Auto-save verification** → Check localStorage
3. **Page reload** → Verify data persists
4. **Step progression** → Advance and verify tracking
5. **Cross-navigation** → Leave and return, verify restoration

### Restart Functionality Test Flow
1. **Progress through onboarding** → Fill data, advance steps
2. **Trigger restart** → Click restart button, confirm dialog
3. **Verify navigation** → Should return to welcome page
4. **Critical reload test** → Reload page, should stay on welcome
5. **Fresh start verification** → Begin new onboarding, forms should be empty

## Critical Success Criteria

### ✅ State Persistence
- Form data saves automatically as user types
- Data persists through page reloads
- Step progression is tracked correctly
- Session data structure is valid

### ✅ Restart Functionality
- Restart button clears previous session
- Navigation returns to welcome page
- **CRITICAL**: After restart + reload, user stays on welcome page (no auto-redirect to steps)
- Fresh onboarding starts with clean forms

### ✅ Session Management
- Sessions expire appropriately
- Expired sessions redirect to welcome
- New sessions generate unique IDs
- localStorage is managed correctly

## localStorage Structure Validation

Expected structure after starting onboarding:
```json
{
  "state": {
    "sessionId": "uuid-string",
    "currentStep": 1,
    "formData": {
      "firstName": "user-input",
      "lastName": "user-input",
      "email": "user-input@example.com"
    },
    "sessionExpiresAt": "2025-01-01T12:00:00.000Z",
    "isSessionExpired": false,
    "completedSteps": []
  },
  "version": 2
}
```

## Bug Fixes Validated

### Issue Fixed: Restart Button localStorage Bug
**Problem**: After restart + reload, users were redirected back to step pages instead of staying on welcome page.

**Solution**:
- Fixed `clearSession()` to properly clear localStorage
- Updated welcome page logic to not auto-redirect with cleared/fresh sessions
- Fixed restart button navigation routing

**Test Validation**: The critical test verifies that after restart + page reload, users stay on the welcome page.

## Browser Compatibility

Tests should pass in:
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Maintenance

### Adding New Tests
When adding new onboarding features:
1. Add test cases to the comprehensive suite
2. Update manual testing guide
3. Verify localStorage structure changes
4. Test restart functionality with new features

### Test Data
Tests use predictable test data:
- Names: "John Doe", "Jane Smith", "TestUser"
- Emails: "test@example.com", "john.doe@example.com"
- Forms should be empty after restart

This test suite ensures the onboarding system maintains reliable state management and restart functionality across all user scenarios.