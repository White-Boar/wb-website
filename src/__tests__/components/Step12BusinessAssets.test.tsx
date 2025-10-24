import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { Step12BusinessAssets } from '@/components/onboarding/steps/Step12BusinessAssets'
import { useOnboardingStore } from '@/stores/onboarding'

// Mock dependencies
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}))

jest.mock('@/stores/onboarding', () => ({
  useOnboardingStore: jest.fn()
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}))

// Mock FileUploadWithProgress component
let mockOnFilesChange: any = null

jest.mock('@/components/onboarding/FileUploadWithProgress', () => ({
  FileUploadWithProgress: ({ onFilesChange, existingFiles, label }: any) => {
    mockOnFilesChange = onFilesChange
    return (
      <div data-testid="file-upload">
        <label>{label}</label>
        <div data-testid="existing-files-count">{existingFiles?.length || 0}</div>
      </div>
    )
  }
}))

// Test component wrapper
function TestComponent({ defaultValues }: { defaultValues?: any }) {
  const form = useForm({
    defaultValues: defaultValues || {
      logoUpload: undefined,
      businessPhotos: [],
      _uploading: false
    }
  })

  return <Step12BusinessAssets form={form} errors={{}} isLoading={false} />
}

describe('Step12BusinessAssets', () => {
  beforeEach(() => {
    ;(useOnboardingStore as jest.Mock).mockReturnValue({
      sessionId: 'test-session-123'
    })
    mockOnFilesChange = null
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ===================================================================
  // RENDERING TESTS
  // ===================================================================

  describe('Rendering', () => {
    it('renders logo upload section', () => {
      render(<TestComponent />)

      expect(screen.getByText('logo.title')).toBeInTheDocument()
      expect(screen.getByText('logo.optional')).toBeInTheDocument()
    })

    it('renders business photos upload section', () => {
      render(<TestComponent />)

      expect(screen.getByText('photos.title')).toBeInTheDocument()
      expect(screen.getByText('photos.optional')).toBeInTheDocument()
    })

    it('renders upload requirements info', () => {
      render(<TestComponent />)

      expect(screen.getByText('logo.requirements.title')).toBeInTheDocument()
      expect(screen.getByText('categories.title')).toBeInTheDocument()
    })

    it('renders quality guidelines', () => {
      render(<TestComponent />)

      expect(screen.getByText('quality.title')).toBeInTheDocument()
    })
  })

  // ===================================================================
  // STATE SYNCHRONIZATION TESTS
  // ===================================================================

  describe('State Synchronization', () => {
    it('syncs logo state from form data on mount', async () => {
      const defaultValues = {
        logoUpload: {
          id: 'existing-logo-id',
          fileName: 'existing-logo.png',
          fileSize: 1024,
          mimeType: 'image/png',
          url: 'https://example.com/existing-logo.png',
          uploadedAt: new Date().toISOString()
        },
        businessPhotos: [],
        _uploading: false
      }

      render(<TestComponent defaultValues={defaultValues} />)

      await waitFor(() => {
        const existingFilesElements = screen.getAllByTestId('existing-files-count')
        // First element is for logo (should be 1)
        expect(existingFilesElements[0]).toHaveTextContent('1')
      })
    })

    it('syncs photos state from form data on mount', async () => {
      const defaultValues = {
        logoUpload: undefined,
        businessPhotos: [
          {
            id: 'photo-1',
            fileName: 'photo1.jpg',
            fileSize: 2048,
            mimeType: 'image/jpeg',
            url: 'https://example.com/photo1.jpg',
            uploadedAt: new Date().toISOString()
          },
          {
            id: 'photo-2',
            fileName: 'photo2.jpg',
            fileSize: 3072,
            mimeType: 'image/jpeg',
            url: 'https://example.com/photo2.jpg',
            uploadedAt: new Date().toISOString()
          }
        ],
        _uploading: false
      }

      render(<TestComponent defaultValues={defaultValues} />)

      await waitFor(() => {
        const existingFilesElements = screen.getAllByTestId('existing-files-count')
        // Second element is for photos (should be 2)
        expect(existingFilesElements[1]).toHaveTextContent('2')
      })
    })
  })

  // ===================================================================
  // UPLOAD ERROR TESTS (Focus on new error handling)
  // ===================================================================

  describe('Upload Errors', () => {
    it('detects and displays network errors', async () => {
      render(<TestComponent />)

      // Wait for component to mount and mockOnFilesChange to be set
      await waitFor(() => {
        expect(mockOnFilesChange).not.toBeNull()
      })

      // Simulate network error
      const mockFile = new File(['test'], 'test-logo.png', { type: 'image/png' })
      act(() => {
        mockOnFilesChange([{
          id: 'test-id-error',
          file: mockFile,
          progress: 0,
          status: 'error',
          error: 'Network connection lost'
        }])
      })

      await waitFor(() => {
        expect(screen.getByText(/Network Error/i)).toBeInTheDocument()
        expect(screen.getByText(/Network connection lost/i)).toBeInTheDocument()
      })
    })

    it('detects and displays file size errors', async () => {
      render(<TestComponent />)

      await waitFor(() => {
        expect(mockOnFilesChange).not.toBeNull()
      })

      // Simulate size error
      const mockFile = new File(['test'], 'large-file.png', { type: 'image/png' })
      act(() => {
        mockOnFilesChange([{
          id: 'test-id-size-error',
          file: mockFile,
          progress: 0,
          status: 'error',
          error: 'File size too large, exceeds maximum'
        }])
      })

      await waitFor(() => {
        expect(screen.getByText(/File Too Large/i)).toBeInTheDocument()
        expect(screen.getByText(/File size exceeds the maximum/i)).toBeInTheDocument()
      })
    })

    it('displays file name in error message', async () => {
      render(<TestComponent />)

      await waitFor(() => {
        expect(mockOnFilesChange).not.toBeNull()
      })

      const mockFile = new File(['test'], 'my-logo.png', { type: 'image/png' })
      act(() => {
        mockOnFilesChange([{
          id: 'test-id-error',
          file: mockFile,
          progress: 0,
          status: 'error',
          error: 'Network error'
        }])
      })

      await waitFor(() => {
        expect(screen.getByText(/File: my-logo.png/i)).toBeInTheDocument()
      })
    })

    it('shows retry button for failed uploads', async () => {
      render(<TestComponent />)

      await waitFor(() => {
        expect(mockOnFilesChange).not.toBeNull()
      })

      const mockFile = new File(['test'], 'test.png', { type: 'image/png' })
      act(() => {
        mockOnFilesChange([{
          id: 'test-error',
          file: mockFile,
          progress: 0,
          status: 'error',
          error: 'Upload failed'
        }])
      })

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })
  })

  // ===================================================================
  // EDGE CASES
  // ===================================================================

  describe('Edge Cases', () => {
    it('handles missing sessionId gracefully', () => {
      ;(useOnboardingStore as jest.Mock).mockReturnValue({
        sessionId: null
      })

      expect(() => {
        render(<TestComponent />)
      }).not.toThrow()
    })

    it('handles undefined form data', () => {
      const defaultValues = {
        logoUpload: undefined,
        businessPhotos: undefined as any,
        _uploading: false
      }

      expect(() => {
        render(<TestComponent defaultValues={defaultValues} />)
      }).not.toThrow()
    })

    it('handles corrupted saved file data', async () => {
      const defaultValues = {
        logoUpload: {
          // Missing required fields
          id: 'corrupted',
          fileName: null as any,
          url: undefined as any
        },
        businessPhotos: [],
        _uploading: false
      }

      render(<TestComponent defaultValues={defaultValues} />)

      // Should not crash, should show 0 files
      await waitFor(() => {
        const existingFilesElements = screen.getAllByTestId('existing-files-count')
        expect(existingFilesElements[0]).toHaveTextContent('0')
      })
    })
  })
})
