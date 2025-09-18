'use client'

import { forwardRef, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Upload, X, FileIcon, AlertCircle, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  label: string
  error?: string
  hint?: string
  success?: string
  required?: boolean
  accept?: string | Record<string, string[]>
  multiple?: boolean
  maxFileSize?: number // in MB
  maxFiles?: number
  value?: File | File[] | null
  onFilesChange?: (files: File[] | File | null) => void
  className?: string
  disabled?: boolean
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({
    label,
    error,
    hint,
    success,
    required = false,
    accept,
    multiple = false,
    maxFileSize = 10,
    maxFiles = 30,
    value,
    onFilesChange,
    className,
    disabled = false
  }, ref) => {
    const t = useTranslations('forms')
    const [files, setFiles] = useState<File[]>(() => {
      if (!value) return []
      if (Array.isArray(value)) return value
      return [value]
    })
    const [isDragOver, setIsDragOver] = useState(false)

    // Convert accept object to string for input element
    const acceptString = typeof accept === 'string' ? accept :
      Object.entries(accept || {}).map(([mime, extensions]) =>
        `${mime},${extensions.join(',')}`
      ).join(',')

    const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
      if (!selectedFiles) return

      const fileArray = Array.from(selectedFiles)
      const validFiles: File[] = []
      let errorMessage = ''

      // Validate files
      for (const file of fileArray) {
        // Check file size
        if (file.size > maxFileSize * 1024 * 1024) {
          errorMessage = `File "${file.name}" exceeds ${maxFileSize}MB limit`
          break
        }
        validFiles.push(file)
      }

      // Check max files limit
      const totalFiles = multiple ? files.length + validFiles.length : validFiles.length
      if (totalFiles > maxFiles) {
        errorMessage = `Maximum ${maxFiles} files allowed`
        return
      }

      if (errorMessage) {
        // Handle error - you might want to use a toast or error state
        console.error(errorMessage)
        return
      }

      const newFiles = multiple ? [...files, ...validFiles] : validFiles
      setFiles(newFiles)

      // For single file upload, return the file itself, not an array
      if (multiple) {
        onFilesChange?.(newFiles)
      } else {
        onFilesChange?.(newFiles[0] || null)
      }
    }, [files, maxFileSize, maxFiles, multiple, onFilesChange])

    const removeFile = useCallback((index: number) => {
      const newFiles = files.filter((_, i) => i !== index)
      setFiles(newFiles)

      // For single file upload, return the file itself or null, not an array
      if (multiple) {
        onFilesChange?.(newFiles)
      } else {
        onFilesChange?.(newFiles[0] || null)
      }
    }, [files, multiple, onFilesChange])

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      handleFileSelect(e.dataTransfer.files)
    }, [handleFileSelect])

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
      <div className={cn('space-y-2', className)}>
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>

        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 transition-colors',
            isDragOver ? 'border-primary bg-primary/5' : 'border-border',
            error ? 'border-destructive' : '',
            disabled ? 'opacity-50 pointer-events-none' : 'hover:border-primary/50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={ref}
            type="file"
            accept={acceptString}
            multiple={multiple}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={disabled}
          />

          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {t('fileUpload.dragAndDrop', { defaultMessage: 'Drag and drop files here, or click to select' })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('fileUpload.maxSize', {
                defaultMessage: `Max ${maxFileSize}MB per file, ${maxFiles} files max`,
                maxSize: maxFileSize,
                maxFiles
              })}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={disabled}
            >
              {t('fileUpload.selectFiles', { defaultMessage: 'Select Files' })}
            </Button>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-muted rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Status Messages */}
        {hint && !error && !success && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 text-xs text-destructive"
          >
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 text-xs text-green-600"
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>{success}</span>
          </motion.div>
        )}
      </div>
    )
  }
)

FileUpload.displayName = 'FileUpload'