# Step 12: Business Assets - Functional Requirements

## Overview
Step 12 of the onboarding flow allows users to upload their business logo and business photos for use in their AI-generated website.

## Functional Requirements

### 1. Logo Upload
**Requirement:** Users can upload a single logo file for their business.

**Specifications:**
- **File Types:** Image files (PNG, JPG, JPEG, GIF, WebP, SVG)
- **File Size Limit:** 5 MB maximum
- **Maximum Files:** 1 logo file
- **Upload Method:** Drag-and-drop or click to browse
- **Progress Tracking:** Real-time upload progress indicator
- **Retry Capability:** Users can retry failed uploads
- **Remove Capability:** Users can remove uploaded logo

**Data Structure:**
```typescript
interface BusinessLogo {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  uploadedAt: string
}
```

**Implementation:**
- Component: `FileUploadWithProgress`
- Form Field: `logoUpload`
- Lines: 131-169 in Step12BusinessAssets.tsx

### 2. Business Photos Upload
**Requirement:** Users can upload multiple business photos to showcase their business.

**Specifications:**
- **File Types:** Image files (PNG, JPG, JPEG, GIF, WebP)
- **File Size Limit:** 10 MB per file
- **Maximum Files:** 10 photos
- **Upload Method:** Drag-and-drop or click to browse
- **Progress Tracking:** Real-time upload progress for each file
- **Retry Capability:** Users can retry individual failed uploads
- **Remove Capability:** Users can remove individual photos

**Data Structure:**
```typescript
interface BusinessPhoto {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  uploadedAt: string
}
```

**Implementation:**
- Component: `FileUploadWithProgress`
- Form Field: `businessPhotos`
- Lines: 240-278 in Step12BusinessAssets.tsx

### 3. File Upload with Progress
**Requirement:** Provide visual feedback during file upload process.

**Features:**
- Real-time progress bar (0-100%)
- Upload status indicators:
  - Uploading (blue spinner icon)
  - Completed (green checkmark)
  - Error (red alert icon with retry button)
- File preview thumbnails for image files
- File size display in human-readable format
- Upload summary statistics (completed/uploading/failed counts)

**Implementation:**
- Component: `FileUploadWithProgress`
- File: /src/components/onboarding/FileUploadWithProgress.tsx

### 4. Upload State Management
**Requirement:** Maintain upload state across component re-renders.

**State Variables:**
- `logoUploadState`: Tracks logo upload progress
- `photosUploadState`: Tracks business photos upload progress
- `hasInitialized`: Prevents duplicate initialization

**Implementation:**
- Lines: 44-46 in Step12BusinessAssets.tsx

### 5. Data Persistence
**Requirement:** Save uploaded file information to localStorage for recovery across sessions.

**Persistence Strategy:**
- Auto-save to localStorage when upload completes
- Restore from localStorage on component mount
- Sync with Zustand store via `updateFormData`

**Implementation:**
- Auto-save: /src/app/[locale]/onboarding/step/[stepNumber]/page.tsx lines 254-263
- Store: /src/stores/onboarding.ts

### 6. UI Restoration
**Requirement:** Restore uploaded files UI state when returning to Step 12.

**Restoration Process:**
1. Check if `businessLogo` exists in form data
2. Convert stored data to `FileUploadProgress` format
3. Set component state with restored data
4. Display files as "completed" status

**Implementation:**
- Lines: 49-71 in Step12BusinessAssets.tsx
- Helper function: `convertToFileUploadProgress` (lines 73-96)

### 7. File Validation
**Requirement:** Validate files before upload to ensure they meet requirements.

**Validation Rules:**
- File size must not exceed limit (5MB for logo, 10MB for photos)
- File type must match accepted MIME types
- Total file count must not exceed maximum

**Implementation:**
- Component: `FileUploadWithProgress`
- Lines: 146-162 in FileUploadWithProgress.tsx

### 8. Upload Error Handling
**Requirement:** Handle upload failures gracefully with retry capability.

**Error Handling:**
- Display error message on upload failure
- Provide "Retry" button for failed uploads
- Retry with exponential backoff (via `retry.fileUpload()`)
- Maximum 3 retry attempts
- Allow removal of failed uploads

**Implementation:**
- Retry logic: /src/lib/retry.ts
- Error display: Lines 350-375 in FileUploadWithProgress.tsx

### 9. Upload Concurrency Control
**Requirement:** Limit simultaneous uploads to prevent overwhelming the server.

**Concurrency Settings:**
- Maximum 3 concurrent uploads
- Process files in batches
- Wait for batch completion before starting next batch

**Implementation:**
- Lines: 188-222 in FileUploadWithProgress.tsx

### 10. Upload Abort Capability
**Requirement:** Allow users to cancel in-progress uploads.

**Implementation:**
- Uses AbortController for each upload
- Abort on file removal
- Clean up abort controllers on completion
- Lines: 225-233 in FileUploadWithProgress.tsx

### 11. Session ID Tracking
**Requirement:** Associate uploads with onboarding session for server-side tracking.

**Implementation:**
- Pass `sessionId` prop to FileUploadWithProgress
- Include in upload FormData
- Lines: 29, 42, 92-94 in FileUploadWithProgress.tsx

### 12. Visual Summary Display
**Requirement:** Show summary of uploaded assets at the bottom of the step.

**Summary Information:**
- Logo file name and size (if uploaded)
- Number of business photos uploaded
- Visual preview of logo
- Count of photos

**Implementation:**
- Lines: 285-326 in Step12BusinessAssets.tsx

### 13. Accessibility
**Requirement:** Ensure file upload is accessible to all users.

**Accessibility Features:**
- Keyboard navigation support
- Screen reader announcements for upload status
- Clear visual indicators for upload states
- ARIA labels for interactive elements
- Focus management

**Implementation:**
- react-dropzone handles keyboard interactions
- Status icons with semantic meaning (CheckCircle, AlertCircle, Loader2)

### 14. Form Integration
**Requirement:** Integrate with React Hook Form for validation and submission.

**Integration:**
- Uses Controller component for form field binding
- Triggers form validation on file changes
- Syncs with form state via `field.onChange`
- Participates in form dirty state tracking

**Implementation:**
- Lines: 121-169, 230-278 in Step12BusinessAssets.tsx

### 15. Internationalization
**Requirement:** Support multiple languages for all UI text.

**i18n Keys:**
- `step12.title`: "Business Assets"
- `step12.description`: "Upload your business logo and photos"
- `step12.logoLabel`: "Business Logo"
- `step12.logoDescription`: "Upload your company logo"
- `step12.photosLabel`: "Business Photos"
- `step12.photosDescription`: "Upload photos of your business"
- `step12.summary.title`: "Uploaded Assets"
- Various summary labels

**Implementation:**
- Lines: 29-30 in Step12BusinessAssets.tsx
- Translation files: /src/messages/en.d.json.ts

## Known Issues and Limitations

### Critical Bug #1: Logo Data Loss on Navigation
**Issue:** When navigating away from Step 12 and returning, uploaded logo data is overwritten with `null`.

**Root Cause:** Lines 141-158 set `field.onChange(null)` when no completed files exist in the upload queue, overwriting existing saved data.

**Impact:** Users lose uploaded logo when navigating between steps.

### Critical Bug #2: Race Condition in Initialization
**Issue:** `hasInitialized` flag prevents re-synchronization when form data changes externally.

**Root Cause:** Lines 49-71 only initialize once, even if `businessLogo` or `businessPhotos` change.

**Impact:** UI may become out of sync with actual form data.

### Medium Issue #3: No Defensive Data Preservation
**Issue:** Component doesn't check for existing field values before overwriting.

**Impact:** Data loss during state transitions.

### Medium Issue #4: Inconsistent Empty Value Handling
**Issue:** Logo returns `null` when empty, photos return `[]` (empty array).

**Impact:** Auto-save behavior differs between fields, causing logo-specific data loss.

### Medium Issue #5: Missing Error Handling
**Issue:** `convertToFileUploadProgress` doesn't handle edge cases or invalid data.

**Impact:** Potential runtime errors if data structure doesn't match expectations.

## Technical Dependencies

- **react-hook-form**: Form state management and validation
- **react-dropzone**: Drag-and-drop file upload interface
- **lucide-react**: Icon library for UI indicators
- **zustand**: State management with localStorage persistence
- **next-intl**: Internationalization

## API Integration

**Upload Endpoint:** `/api/onboarding/upload`

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `file`: File object
  - `type`: "business-asset"
  - `sessionId`: Onboarding session identifier

**Response:**
```typescript
{
  success: boolean
  data?: {
    url: string  // Uploaded file URL
  }
  error?: string
}
```

**Implementation:** Lines 88-113 in FileUploadWithProgress.tsx
