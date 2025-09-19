'use client'

import React, { useState, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, AlertCircle, FileImage, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { retry } from '@/lib/retry'

export interface FileUploadProgress {
  file: File
  id: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
  url?: string
  preview?: string
}

interface FileUploadWithProgressProps {
  accept: string[]
  maxFiles: number
  maxFileSize: number
  onFilesChange: (files: FileUploadProgress[]) => void
  label: string
  description?: string
  className?: string
  disabled?: boolean
  existingFiles?: FileUploadProgress[]
}

export function FileUploadWithProgress({
  accept,
  maxFiles,
  maxFileSize,
  onFilesChange,
  label,
  description,
  className,
  disabled = false,
  existingFiles = []
}: FileUploadWithProgressProps) {
  const [uploadQueue, setUploadQueue] = useState<FileUploadProgress[]>(existingFiles)
  const [isDragActive, setIsDragActive] = useState(false)
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const generateFileId = () => crypto.randomUUID()

  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
  }

  const uploadFile = async (fileProgress: FileUploadProgress): Promise<FileUploadProgress> => {
    const controller = new AbortController()
    abortControllersRef.current.set(fileProgress.id, controller)

    try {
      const result = await retry.fileUpload(async () => {
        const formData = new FormData()
        formData.append('file', fileProgress.file)
        formData.append('type', 'business-asset')

        const response = await fetch('/api/onboarding/upload', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        })

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`)
        }

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Upload failed')
        }

        return result.data
      })

      if (!result.success) {
        throw result.error || new Error('Upload failed after retries')
      }

      const uploadResult = result.data!

      return {
        ...fileProgress,
        status: 'completed',
        progress: 100,
        url: uploadResult.url
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error // Don't retry aborted uploads
      }

      return {
        ...fileProgress,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    } finally {
      abortControllersRef.current.delete(fileProgress.id)
    }
  }

  const processFiles = async (files: File[]) => {
    if (disabled) return

    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        console.warn(`File ${file.name} exceeds size limit`)
        return false
      }

      const isValidType = accept.some(type =>
        file.type.match(type.replace('*', '.*'))
      )

      if (!isValidType) {
        console.warn(`File ${file.name} has invalid type`)
        return false
      }

      return true
    })

    // Limit number of files
    const filesToProcess = validFiles.slice(0, maxFiles - uploadQueue.length)

    // Create initial file progress objects
    const newFileProgresses: FileUploadProgress[] = await Promise.all(
      filesToProcess.map(async (file) => {
        const id = generateFileId()
        const preview = file.type.startsWith('image/') ? await createFilePreview(file) : undefined

        return {
          file,
          id,
          progress: 0,
          status: 'uploading' as const,
          preview
        }
      })
    )

    // Update queue with new files
    const updatedQueue = [...uploadQueue, ...newFileProgresses]
    setUploadQueue(updatedQueue)
    onFilesChange(updatedQueue)

    // Start uploads in parallel with concurrency limit
    const concurrencyLimit = 3
    const uploadPromises: Promise<void>[] = []

    for (let i = 0; i < newFileProgresses.length; i += concurrencyLimit) {
      const batch = newFileProgresses.slice(i, i + concurrencyLimit)

      const batchPromise = Promise.all(
        batch.map(async (fileProgress) => {
          try {
            const updatedFileProgress = await uploadFile(fileProgress)

            setUploadQueue(current => {
              const updated = current.map(item =>
                item.id === fileProgress.id ? updatedFileProgress : item
              )
              onFilesChange(updated)
              return updated
            })
          } catch (error) {
            console.error('Upload error:', error)

            setUploadQueue(current => {
              const updated = current.map(item =>
                item.id === fileProgress.id
                  ? { ...item, status: 'error' as const, error: 'Upload failed' }
                  : item
              )
              onFilesChange(updated)
              return updated
            })
          }
        })
      ).then(() => {}) // Convert to void promise

      uploadPromises.push(batchPromise)
    }

    // Wait for all batches to complete
    await Promise.all(uploadPromises)
  }

  const removeFile = (id: string) => {
    // Cancel upload if in progress
    const controller = abortControllersRef.current.get(id)
    if (controller) {
      controller.abort()
    }

    const updated = uploadQueue.filter(item => item.id !== id)
    setUploadQueue(updated)
    onFilesChange(updated)
  }

  const retryFile = async (id: string) => {
    const fileToRetry = uploadQueue.find(item => item.id === id)
    if (!fileToRetry || fileToRetry.status !== 'error') return

    const updatedFile = { ...fileToRetry, status: 'uploading' as const, progress: 0, error: undefined }

    setUploadQueue(current => {
      const updated = current.map(item => item.id === id ? updatedFile : item)
      onFilesChange(updated)
      return updated
    })

    try {
      const result = await uploadFile(updatedFile)

      setUploadQueue(current => {
        const updated = current.map(item => item.id === id ? result : item)
        onFilesChange(updated)
        return updated
      })
    } catch (error) {
      console.error('Retry failed:', error)
    }
  }

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop: processFiles,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: maxFiles - uploadQueue.length,
    maxSize: maxFileSize,
    disabled,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  })

  const canUploadMore = uploadQueue.length < maxFiles && !disabled

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      {canUploadMore && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragActive || dropzoneActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-primary/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">{label}</h3>
          {description && (
            <p className="text-sm text-gray-500 mb-4">{description}</p>
          )}
          <p className="text-sm text-gray-600">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Max {maxFiles} files, {formatFileSize(maxFileSize)} each
          </p>
        </div>
      )}

      {/* File List */}
      {uploadQueue.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">
            Files ({uploadQueue.length}/{maxFiles})
          </h4>

          {uploadQueue.map((fileProgress) => (
            <div
              key={fileProgress.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              {/* File Preview/Icon */}
              <div className="flex-shrink-0">
                {fileProgress.preview ? (
                  <img
                    src={fileProgress.preview}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <FileImage className="w-10 h-10 text-gray-400" />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileProgress.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(fileProgress.file.size)}
                </p>

                {/* Progress Bar */}
                {fileProgress.status === 'uploading' && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${fileProgress.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {fileProgress.progress}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {fileProgress.status === 'error' && fileProgress.error && (
                  <p className="text-xs text-red-600 mt-1">
                    {fileProgress.error}
                  </p>
                )}
              </div>

              {/* Status Icon */}
              <div className="flex-shrink-0 flex items-center gap-2">
                {fileProgress.status === 'uploading' && (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                )}
                {fileProgress.status === 'completed' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {fileProgress.status === 'error' && (
                  <>
                    <button
                      onClick={() => retryFile(fileProgress.id)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Retry
                    </button>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(fileProgress.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                  disabled={fileProgress.status === 'uploading'}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Summary */}
      {uploadQueue.length > 0 && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            Completed: {uploadQueue.filter(f => f.status === 'completed').length} |
            Uploading: {uploadQueue.filter(f => f.status === 'uploading').length} |
            Failed: {uploadQueue.filter(f => f.status === 'error').length}
          </p>
        </div>
      )}
    </div>
  )
}