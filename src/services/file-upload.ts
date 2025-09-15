import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import { OnboardingClientService } from './onboarding-client'
import AnalyticsService from './analytics'
import { UploadedFile } from '@/types/onboarding'

// =============================================================================
// FILE UPLOAD CONFIGURATION
// =============================================================================

const UPLOAD_CONFIG = {
  logo: {
    maxSizeMB: 10,
    maxWidthOrHeight: 1920,
    supportedTypes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'],
    bucket: 'onboarding-uploads',
    folder: 'logos'
  },
  photo: {
    maxSizeMB: 5,
    maxWidthOrHeight: 1920,
    supportedTypes: ['image/png', 'image/jpg', 'image/jpeg'],
    bucket: 'onboarding-uploads',
    folder: 'photos'
  }
} as const

const COMPRESSION_CONFIG = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg',
  initialQuality: 0.8
}

// =============================================================================
// FILE UPLOAD UTILITY SERVICE
// =============================================================================

export class FileUploadService {

  // ===========================================================================
  // FILE VALIDATION
  // ===========================================================================

  /**
   * Validate file before upload
   */
  static validateFile(
    file: File,
    type: 'logo' | 'photo'
  ): { isValid: boolean; error?: string } {
    const config = UPLOAD_CONFIG[type]

    // Check file type
    if (!config.supportedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Invalid file type. Supported types: ${config.supportedTypes.join(', ')}`
      }
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > config.maxSizeMB) {
      return {
        isValid: false,
        error: `File size too large. Maximum size: ${config.maxSizeMB}MB`
      }
    }

    // Check file name
    if (!file.name || file.name.length > 255) {
      return {
        isValid: false,
        error: 'Invalid file name'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate multiple files with total size check
   */
  static validateMultipleFiles(
    files: File[],
    type: 'logo' | 'photo',
    maxTotalSizeMB: number = 50
  ): { isValid: boolean; error?: string; invalidFiles?: string[] } {
    if (files.length === 0) {
      return { isValid: false, error: 'No files selected' }
    }

    const invalidFiles: string[] = []
    let totalSize = 0

    for (const file of files) {
      const validation = this.validateFile(file, type)
      if (!validation.isValid) {
        invalidFiles.push(`${file.name}: ${validation.error}`)
      }
      totalSize += file.size / (1024 * 1024)
    }

    if (invalidFiles.length > 0) {
      return {
        isValid: false,
        error: 'Some files are invalid',
        invalidFiles
      }
    }

    if (totalSize > maxTotalSizeMB) {
      return {
        isValid: false,
        error: `Total file size (${totalSize.toFixed(1)}MB) exceeds limit of ${maxTotalSizeMB}MB`
      }
    }

    return { isValid: true }
  }

  // ===========================================================================
  // IMAGE COMPRESSION
  // ===========================================================================

  /**
   * Compress image file
   */
  static async compressImage(
    file: File,
    options: {
      maxSizeMB?: number
      maxWidthOrHeight?: number
      quality?: number
    } = {}
  ): Promise<File> {
    try {
      // Skip compression for SVG files
      if (file.type === 'image/svg+xml') {
        return file
      }

      const compressionOptions = {
        ...COMPRESSION_CONFIG,
        ...options
      }

      const compressedFile = await imageCompression(file, compressionOptions)

      // If compression didn't help much, use original
      if (compressedFile.size >= file.size * 0.9) {
        return file
      }

      return compressedFile
    } catch (error) {
      console.error('Image compression failed:', error)
      // Return original file if compression fails
      return file
    }
  }

  /**
   * Get image dimensions
   */
  static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  // ===========================================================================
  // SUPABASE STORAGE OPERATIONS
  // ===========================================================================

  /**
   * Upload single file to Supabase Storage
   */
  static async uploadFile(
    sessionId: string,
    file: File,
    type: 'logo' | 'photo'
  ): Promise<UploadedFile> {
    const startTime = Date.now()

    try {
      // Track upload start
      AnalyticsService.trackFileUpload(sessionId, 'upload_start', type, {
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type
      })

      // Validate file
      const validation = this.validateFile(file, type)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      // Compress image if needed
      const processedFile = await this.compressImage(file, {
        maxSizeMB: UPLOAD_CONFIG[type].maxSizeMB * 0.8, // Leave some buffer
        maxWidthOrHeight: UPLOAD_CONFIG[type].maxWidthOrHeight
      })

      // Get image dimensions (for non-SVG files)
      let dimensions: { width: number; height: number } | undefined
      try {
        if (processedFile.type !== 'image/svg+xml') {
          dimensions = await this.getImageDimensions(processedFile)
        }
      } catch (error) {
        console.warn('Failed to get image dimensions:', error)
      }

      // Generate unique file name
      const fileExtension = this.getFileExtension(processedFile.name)
      const fileName = `${sessionId}/${type}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`
      const filePath = `${UPLOAD_CONFIG[type].folder}/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(UPLOAD_CONFIG[type].bucket)
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(UPLOAD_CONFIG[type].bucket)
        .getPublicUrl(filePath)

      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL')
      }

      // Record in database via API route
      const recordResponse = await fetch('/api/onboarding/record-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          fileType: type,
          fileUrl: urlData.publicUrl,
          fileName: processedFile.name,
          fileSize: processedFile.size,
          mimeType: processedFile.type,
          dimensions
        })
      })

      const recordResult = await recordResponse.json()

      if (!recordResponse.ok || !recordResult.success) {
        throw new Error(recordResult.error || 'Failed to record file upload')
      }

      const uploadedFile = recordResult.data

      // Track successful upload
      const uploadTime = Date.now() - startTime
      AnalyticsService.trackFileUpload(sessionId, 'upload_success', type, {
        file_name: processedFile.name,
        file_size: processedFile.size,
        mime_type: processedFile.type,
        upload_time_ms: uploadTime,
        compression_ratio: processedFile.size / file.size,
        dimensions: dimensions ? `${dimensions.width}x${dimensions.height}` : undefined
      })

      return uploadedFile
    } catch (error) {
      // Track failed upload
      const uploadTime = Date.now() - startTime
      AnalyticsService.trackFileUpload(sessionId, 'upload_error', type, {
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        upload_time_ms: uploadTime,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })

      console.error('File upload failed:', error)
      throw error instanceof Error ? error : new Error('File upload failed')
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadMultipleFiles(
    sessionId: string,
    files: File[],
    type: 'logo' | 'photo',
    onProgress?: (progress: number, fileName: string) => void
  ): Promise<UploadedFile[]> {
    try {
      // Validate all files first
      const validation = this.validateMultipleFiles(files, type)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      const uploadedFiles: UploadedFile[] = []
      const totalFiles = files.length

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        try {
          const uploadedFile = await this.uploadFile(sessionId, file, type)
          uploadedFiles.push(uploadedFile)
          
          // Report progress
          const progress = ((i + 1) / totalFiles) * 100
          onProgress?.(progress, file.name)
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          // Continue with other files, but track the error
          AnalyticsService.trackFileUpload(sessionId, 'upload_error', type, {
            file_name: file.name,
            error_in_batch: true,
            batch_position: i
          })
        }
      }

      return uploadedFiles
    } catch (error) {
      console.error('Batch upload failed:', error)
      throw error instanceof Error ? error : new Error('Batch upload failed')
    }
  }

  // ===========================================================================
  // FILE MANAGEMENT
  // ===========================================================================

  /**
   * Delete file from storage
   */
  static async deleteFile(
    sessionId: string,
    fileUrl: string,
    type: 'logo' | 'photo'
  ): Promise<void> {
    try {
      // Extract file path from URL
      const filePath = this.extractFilePathFromUrl(fileUrl, type)
      if (!filePath) {
        throw new Error('Invalid file URL')
      }

      // Delete from Supabase Storage
      const { error } = await supabase.storage
        .from(UPLOAD_CONFIG[type].bucket)
        .remove([filePath])

      if (error) {
        throw new Error(`Delete failed: ${error.message}`)
      }

      // Note: We don't delete from onboarding_uploads table
      // to maintain audit trail, just mark as deleted if needed
    } catch (error) {
      console.error('File deletion failed:', error)
      throw error instanceof Error ? error : new Error('File deletion failed')
    }
  }

  /**
   * Get uploaded files for session
   */
  static async getSessionFiles(
    sessionId: string,
    type?: 'logo' | 'photo'
  ): Promise<UploadedFile[]> {
    try {
      return await OnboardingClientService.getUploadedFiles(sessionId, type)
    } catch (error) {
      console.error('Failed to get session files:', error)
      throw error instanceof Error ? error : new Error('Failed to get session files')
    }
  }

  /**
   * Clean up temporary files for expired sessions
   */
  static async cleanupExpiredFiles(): Promise<void> {
    try {
      // This would typically be run as a background job
      // Get expired sessions and their files, then delete from storage
      console.log('File cleanup would be implemented here')
    } catch (error) {
      console.error('File cleanup failed:', error)
    }
  }

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================

  /**
   * Get file extension from filename
   */
  private static getFileExtension(fileName: string): string {
    const parts = fileName.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'bin'
  }

  /**
   * Extract file path from Supabase public URL
   */
  private static extractFilePathFromUrl(url: string, type: 'logo' | 'photo'): string | null {
    try {
      const bucketName = UPLOAD_CONFIG[type].bucket
      const bucketPath = `/storage/v1/object/public/${bucketName}/`
      const pathIndex = url.indexOf(bucketPath)
      
      if (pathIndex === -1) return null
      
      return url.substring(pathIndex + bucketPath.length)
    } catch {
      return null
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Check if file type is supported
   */
  static isSupportedFileType(file: File, type: 'logo' | 'photo'): boolean {
    return UPLOAD_CONFIG[type].supportedTypes.includes(file.type)
  }

  /**
   * Get upload configuration for UI display
   */
  static getUploadConfig(type: 'logo' | 'photo'): {
    maxSizeMB: number
    supportedTypes: string[]
    maxFiles: number
  } {
    const config = UPLOAD_CONFIG[type]
    return {
      maxSizeMB: config.maxSizeMB,
      supportedTypes: config.supportedTypes,
      maxFiles: type === 'logo' ? 1 : 10
    }
  }
}

// =============================================================================
// REACT HOOK FOR FILE UPLOAD
// =============================================================================

import { useState, useCallback } from 'react'

export interface FileUploadHook {
  uploading: boolean
  progress: number
  error: string | null
  uploadedFiles: UploadedFile[]
  uploadFile: (file: File, type: 'logo' | 'photo') => Promise<UploadedFile | null>
  uploadMultipleFiles: (files: File[], type: 'logo' | 'photo') => Promise<UploadedFile[]>
  deleteFile: (fileUrl: string, type: 'logo' | 'photo') => Promise<void>
  clearError: () => void
}

/**
 * Custom hook for file upload operations
 */
export function useFileUpload(sessionId: string): FileUploadHook {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const uploadFile = useCallback(async (
    file: File,
    type: 'logo' | 'photo'
  ): Promise<UploadedFile | null> => {
    if (!sessionId) {
      setError('No active session')
      return null
    }

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const uploadedFile = await FileUploadService.uploadFile(sessionId, file, type)
      setUploadedFiles(prev => [...prev, uploadedFile])
      setProgress(100)
      return uploadedFile
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      return null
    } finally {
      setUploading(false)
      // Reset progress after a delay
      setTimeout(() => setProgress(0), 1000)
    }
  }, [sessionId])

  const uploadMultipleFiles = useCallback(async (
    files: File[],
    type: 'logo' | 'photo'
  ): Promise<UploadedFile[]> => {
    if (!sessionId) {
      setError('No active session')
      return []
    }

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const results = await FileUploadService.uploadMultipleFiles(
        sessionId,
        files,
        type,
        (progressPercent, fileName) => {
          setProgress(progressPercent)
        }
      )
      
      setUploadedFiles(prev => [...prev, ...results])
      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch upload failed'
      setError(errorMessage)
      return []
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }, [sessionId])

  const deleteFile = useCallback(async (
    fileUrl: string,
    type: 'logo' | 'photo'
  ): Promise<void> => {
    try {
      await FileUploadService.deleteFile(sessionId, fileUrl, type)
      setUploadedFiles(prev => prev.filter(f => f.url !== fileUrl))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed'
      setError(errorMessage)
    }
  }, [sessionId])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    uploading,
    progress,
    error,
    uploadedFiles,
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    clearError
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Validate and upload logo file
 */
export async function uploadLogo(
  sessionId: string,
  file: File
): Promise<UploadedFile> {
  return await FileUploadService.uploadFile(sessionId, file, 'logo')
}

/**
 * Validate and upload business photos
 */
export async function uploadBusinessPhotos(
  sessionId: string,
  files: File[],
  onProgress?: (progress: number, fileName: string) => void
): Promise<UploadedFile[]> {
  return await FileUploadService.uploadMultipleFiles(sessionId, files, 'photo', onProgress)
}

/**
 * Check if file upload service is properly configured
 */
export function isFileUploadConfigured(): boolean {
  // Check if Supabase storage is available
  return !!supabase && typeof window !== 'undefined'
}

export { FileUploadService }