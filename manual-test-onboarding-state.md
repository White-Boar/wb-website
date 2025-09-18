# Manual Test: Onboarding State Management & Restart Functionality

## Test 1: State Persistence During Onboarding

### Steps:
1. Navigate to `http://localhost:3000/en/onboarding`
2. Click "Start Your Website"
3. Fill out Step 1 form:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john.doe@example.com"
4. Wait 2 seconds for auto-save
5. **Reload the page** (Ctrl+R / Cmd+R)

### Expected Results:
- ✅ Should stay on `/onboarding/step/1`
- ✅ Form should still contain the filled data
- ✅ localStorage should contain the session data

### Verification:
Open browser dev tools → Application → Local Storage → Check `wb-onboarding-store`:
```json
{
  "state": {
    "sessionId": "some-uuid",
    "currentStep": 1,
    "formData": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    }
  }
}
```

---

## Test 2: Step Progression State

### Steps:
1. Continue from Test 1 (or start fresh)
2. Fill Step 1 form completely
3. Click "Next" to go to Step 2
4. **Reload the page**

### Expected Results:
- ✅ Should stay on `/onboarding/step/2`
- ✅ localStorage `currentStep` should be `2`
- ✅ Previous form data should be preserved

---

## Test 3: Restart Functionality

### Steps:
1. Progress to Step 2 (from previous tests)
2. Click the "Restart" button (top-right)
3. Click "Start Over" in the confirmation dialog
4. **Reload the page**

### Expected Results:
- ✅ Should navigate to `/en/onboarding` (welcome page)
- ✅ After reload, should STAY on welcome page (not redirect to step)
- ✅ localStorage should be either cleared or contain a new session with fresh data
- ✅ When starting onboarding again, form should be empty

### Critical Test:
**The key bug fix**: After restart + reload, user should NOT be redirected back to a step page.

---

## Test 4: Navigation Persistence

### Steps:
1. Start onboarding, fill Step 1
2. Navigate to homepage (`http://localhost:3000`)
3. Navigate back to onboarding (`http://localhost:3000/en/onboarding`)

### Expected Results:
- ✅ Should automatically redirect to Step 1 (where you left off)
- ✅ Form data should be preserved

---

## Test 5: Session Expiration

### Steps:
1. Start onboarding
2. Open dev tools → Application → Local Storage
3. Edit `wb-onboarding-store` and set:
   ```json
   "sessionExpiresAt": "2020-01-01T00:00:00.000Z",
   "isSessionExpired": true
   ```
4. Reload the page

### Expected Results:
- ✅ Should redirect to welcome page
- ✅ Should start fresh onboarding

---

## Browser Testing

Test in multiple browsers:
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari (if on macOS)

All functionality should work consistently across browsers.

---

## Success Criteria

**State Persistence**: ✅ Form data and progression saved automatically
**Restart Functionality**: ✅ Clears state and allows fresh start
**Reload Behavior**: ✅ Maintains user's position in onboarding
**Navigation**: ✅ Handles browser back/forward correctly
**Session Management**: ✅ Handles expiration gracefully

If all tests pass, the onboarding state management is working correctly!