# Step 12 File Upload UI Sync Issue

**Date:** 2025-10-21
**Status:** Data persistence ✅ FIXED | UI display ❌ BROKEN

---

## Current Problem

**Files uploaded on Step 12 don't appear in UI when navigating back from Step 13**

### What Works ✅
- Files ARE saved to Zustand store
- Files ARE persisted to localStorage
- Files STAY in localStorage through navigation

### What Doesn't Work ❌
- **Files do NOT appear in the UI after navigating back**

---

## Verified Behavior

Manual testing confirms:

1. Upload logo + photo on Step 12
2. Navigate to Step 13
3. Check localStorage: `businessPhotos: [{id, fileName, ...}]` ✅ Present
4. Navigate back to Step 12
5. Check localStorage: `businessPhotos: [{id, fileName, ...}]` ✅ Still present
6. **Check UI: ❌ NO FILES VISIBLE**

**Conclusion:** Data persistence works. UI sync is broken.

---

## Root Cause: Dual State Architecture

### The Two States

Step12BusinessAssets maintains separate states:

```typescript
// 1. FORM STATE (persistent - React Hook Form + Zustand)
const businessLogo = watch('logoUpload')       // ✅ Has data after form.reset()
const businessPhotos = watch('businessPhotos') // ✅ Has data after form.reset()

// 2. COMPONENT STATE (ephemeral - useState, drives UI)
const [logoUploadState, setLogoUploadState] = useState<FileUploadProgress[]>([])       // ❌ Empty!
const [photosUploadState, setPhotosUploadState] = useState<FileUploadProgress[]>([])   // ❌ Empty!

// UI receives component state, NOT form state
<FileUploadWithProgress existingFiles={logoUploadState} />   // ❌ Shows nothing
<FileUploadWithProgress existingFiles={photosUploadState} /> // ❌ Shows nothing
```

### The Broken Sync

A `useEffect` should sync component state FROM form state:

```typescript
React.useEffect(() => {
  const hasLogoChanged = JSON.stringify(prevFormDataRef.current.logo) !== JSON.stringify(businessLogo)

  if (hasLogoChanged) {  // ❌ This condition fails!
    if (businessLogo) {
      const logoProgress = convertToFileUploadProgress(businessLogo)
      if (logoProgress) {
        setLogoUploadState([logoProgress])  // Never executes
      }
    }
  }

  prevFormDataRef.current = { logo: businessLogo, photos: businessPhotos }
}, [businessLogo, businessPhotos, convertToFileUploadProgress])
```

**Why it fails:**

1. Component mounts → `businessLogo = undefined`, `prevRef = undefined`
2. Sync effect runs → `undefined !== undefined` → **No change detected!**
3. Form resets → `businessLogo` gets value
4. Sync effect runs again → JSON comparison still doesn't detect change properly
5. `logoUploadState` stays empty → UI shows nothing

---

## What I've Tried (Failed Attempts)

### Attempt 1: Remove Change Detection

**Tried:**
```typescript
React.useEffect(() => {
  // Always sync - no change detection
  if (businessLogo) {
    setLogoUploadState([convertToFileUploadProgress(businessLogo)])
  } else {
    setLogoUploadState([])
  }
}, [businessLogo])
```

**Result:** ❌ **Broke file uploads!**

**Why:** Effect runs on EVERY render. During upload:
- User selects file → component state shows "uploading"
- Form hasn't updated yet (still empty)
- Effect sees `businessLogo = undefined` → **clears component state mid-upload!**

### Attempt 2: Preserve Uploading State

**Tried:**
```typescript
if (businessPhotos?.length === 0) {
  const hasUploading = photosUploadState.some(f => f.status === 'uploading')
  if (!hasUploading) {
    setPhotosUploadState([])
  }
}
```

**Result:** ❌ Didn't solve the core sync issue

---

## Debug Evidence

Console logs when returning to Step 12:

```
[Form Reset Effect] currentValues: {logoUpload: Object}  ← Form HAS the data
[Form Reset Effect] Form values after reset: {logoUpload: Object}  ← Reset worked
[Step12BusinessAssets] Sync Effect Running
  businessLogo: undefined  ← But watch() returns undefined!
  logoUploadState: []  ← Component state empty
```

**Key insight:** Even though `form.reset({logoUpload: {...}})` is called, `watch('logoUpload')` returns `undefined`!

**This is a React Hook Form timing issue** - `watch()` doesn't immediately reflect `reset()` values.

---

## Recommended Solutions

### Option A: Derive UI State (Recommended)

**Eliminate dual state** - use `useMemo` to derive UI state from form state:

```typescript
// Remove useState - derive instead
const logoDisplay = React.useMemo(() => {
  if (!businessLogo) return []
  const progress = convertToFileUploadProgress(businessLogo)
  return progress ? [progress] : []
}, [businessLogo, convertToFileUploadProgress])

const photosDisplay = React.useMemo(() => {
  if (!businessPhotos || businessPhotos.length === 0) return []
  return businessPhotos
    .map(convertToFileUploadProgress)
    .filter((p): p is FileUploadProgress => p !== null)
}, [businessPhotos, convertToFileUploadProgress])

// Use derived state
<FileUploadWithProgress existingFiles={logoDisplay} />
<FileUploadWithProgress existingFiles={photosDisplay} />
```

**Pros:**
- No sync needed - always current
- Simpler, single source of truth
- No timing issues

**Cons:**
- Can't track ephemeral upload progress separately
- May need FileUploadWithProgress changes

### Option B: Force Sync on Mount

Separate mount effect from change detection:

```typescript
// Force initial sync when component mounts
React.useEffect(() => {
  if (businessLogo) {
    const logoProgress = convertToFileUploadProgress(businessLogo)
    if (logoProgress) setLogoUploadState([logoProgress])
  }
  if (businessPhotos?.length > 0) {
    const photosProgress = businessPhotos
      .map(convertToFileUploadProgress)
      .filter((p): p is FileUploadProgress => p !== null)
    setPhotosUploadState(photosProgress)
  }
}, []) // ← Empty deps, runs once

// Keep existing change detection for updates
React.useEffect(() => {
  // ... existing sync logic
}, [businessLogo, businessPhotos, convertToFileUploadProgress])
```

### Option C: Wait for Form Ready

Add delay for form reset to complete:

```typescript
const [isFormReady, setIsFormReady] = React.useState(false)

React.useEffect(() => {
  const timeout = setTimeout(() => setIsFormReady(true), 100)
  return () => clearTimeout(timeout)
}, [businessLogo, businessPhotos])

React.useEffect(() => {
  if (!isFormReady) return // Wait until ready
  // ... sync logic
}, [isFormReady, businessLogo, businessPhotos])
```

---

## Affected Files

### `src/components/onboarding/steps/Step12BusinessAssets.tsx`

**Lines 50-51:** Component state
```typescript
const [logoUploadState, setLogoUploadState] = useState<FileUploadProgress[]>([])
const [photosUploadState, setPhotosUploadState] = useState<FileUploadProgress[]>([])
```

**Lines 156-189:** Broken sync effect
```typescript
React.useEffect(() => {
  const hasLogoChanged = JSON.stringify(prevFormDataRef.current.logo) !== JSON.stringify(businessLogo)
  // ... sync logic that doesn't trigger
}, [businessLogo, businessPhotos, convertToFileUploadProgress])
```

**Lines 266, 445:** UI uses component state
```typescript
<FileUploadWithProgress existingFiles={logoUploadState} />
<FileUploadWithProgress existingFiles={photosUploadState} />
```

### `src/app/[locale]/onboarding/step/[stepNumber]/page.tsx`

**Lines 262-276:** Form reset
```typescript
useEffect(() => {
  const currentValues = getStepDefaultValues(stepNumber)
  form.reset(currentValues, { keepDefaultValues: true })
}, [formData, stepNumber, form, getStepDefaultValues])
```

---

## Next Step

**Implement Option A** - derive UI state using `useMemo` instead of maintaining separate component state.

This is the cleanest solution and avoids all timing/sync complexity.

---

## Background: Fixes Already Applied

These data persistence issues were fixed earlier (no longer relevant):

1. ✅ Auto-save was overwriting photos with empty `[]` arrays
   - **Fixed:** Filter empty arrays in auto-save

2. ✅ `getStepDefaultValues` was including empty arrays in reset
   - **Fixed:** Only include arrays with `length > 0`

The remaining issue is purely UI display, not data persistence.
