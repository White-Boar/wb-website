'use client'

import { useState, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  X, 
  File, 
  Image as ImageIcon,
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Eye,
  Download,
  RotateCcw
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useFileUpload } from '@/services/file-upload'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  label: string
  accept?: Record<string, string[]>
  maxFiles?: number
  maxSize?: number // in bytes
  multiple?: boolean
  required?: boolean
  error?: string
  hint?: string
  success?: string
  className?: string
  onFilesChange?: (files: UploadedFile[]) => void
  onUploadComplete?: (files: UploadedFile[]) => void
  onUploadError?: (error: string) => void
}

interface UploadedFile {
  id: string
  file: File
  url?: string
  progress?: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  compressed?: boolean
  originalSize?: number
  compressedSize?: number
}

export function FileUpload({
  label,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
    'application/pdf': ['.pdf']
  },
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = true,
  required = false,
  error,
  hint,
  success,
  className,
  onFilesChange,
  onUploadComplete,
  onUploadError
}: FileUploadProps) {
  const t = useTranslations('forms.fileUpload')
  const { toast } = useToast()
  const { uploadFile } = useFileUpload('file-upload')
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const inputId = `file-upload-${Math.random().toString(36).substr(2, 9)}`
  const hasError = !!error
  const hasSuccess = !!success && !hasError
  const canUploadMore = uploadedFiles.length < maxFiles

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return t('fileTooLarge', { 
        maxSize: formatFileSize(maxSize),
        fileName: file.name 
      })
    }

    // Check file type
    const fileType = file.type
    const acceptedTypes = Object.keys(accept)
    const acceptedExtensions = Object.values(accept).flat()
    
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.slice(0, -1))
      }
      return fileType === type
    })
    
    const hasValidExtension = acceptedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext.toLowerCase())
    )

    if (!isValidType && !hasValidExtension) {
      return t('invalidFileType', { 
        fileName: file.name,
        accepted: acceptedExtensions.join(', ')
      })
    }

    return null
  }

  // Process files
  const processFiles = useCallback(async (files: File[]) => {
    const validFiles: File[] = []
    const errors: string[] = []

    // Validate each file
    files.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        validFiles.push(file)
      }
    })

    // Show validation errors
    errors.forEach(error => {
      toast({
        variant: "destructive",
        description: error
      })
    })

    // Check total file limit
    const remainingSlots = maxFiles - uploadedFiles.length
    const filesToProcess = validFiles.slice(0, remainingSlots)

    if (validFiles.length > remainingSlots) {
      toast({
        variant: "destructive", 
        description: t('tooManyFiles', { 
          max: maxFiles,
          attempted: validFiles.length
        })
      })
    }

    // Create file objects
    const newFiles: UploadedFile[] = filesToProcess.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'pending',
      originalSize: file.size
    }))

    // Update state
    const updatedFiles = [...uploadedFiles, ...newFiles]
    setUploadedFiles(updatedFiles)
    onFilesChange?.(updatedFiles)

    // Start uploads
    for (const fileObj of newFiles) {
      await uploadSingleFile(fileObj)
    }
  }, [uploadedFiles, maxFiles, maxSize, accept, toast, onFilesChange])

  // Upload single file
  const uploadSingleFile = async (fileObj: UploadedFile) => {
    try {
      // Update status to uploading
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        )
      )

      const result = await (uploadFile as any)(
        fileObj.file,
        (progress: any) => {
          // Update progress
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === fileObj.id 
                ? { ...f, progress }
                : f
            )
          )
        }
      )

      // Update with completed result
      setUploadedFiles(prev => {
        const updated = prev.map(f => 
          f.id === fileObj.id 
            ? { 
                ...f, 
                status: 'completed' as const,
                url: result.url,
                compressed: result.compressed,
                compressedSize: result.compressedSize,
                progress: 100
              }
            : f
        )
        
        // Check if all uploads are complete
        const allComplete = updated.every(f => f.status === 'completed' || f.status === 'error')
        if (allComplete) {
          const completedFiles = updated.filter(f => f.status === 'completed')
          onUploadComplete?.(completedFiles)
        }

        return updated
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('uploadError')
      
      // Update status to error
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      )

      onUploadError?.(errorMessage)
    }
  }

  // Retry upload
  const retryUpload = (fileObj: UploadedFile) => {
    uploadSingleFile(fileObj)
  }

  // Remove file
  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId)
    setUploadedFiles(updatedFiles)
    onFilesChange?.(updatedFiles)
  }

  // Dropzone handlers
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setDragActive(false)
    processFiles(acceptedFiles)
  }, [processFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: multiple ? maxFiles : 1,
    multiple,
    disabled: !canUploadMore,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false)
  })

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file type icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8" />
    }
    return <File className="w-8 h-8" />
  }

  // Get accepted file types for display
  const getAcceptedTypesText = () => {
    const extensions = Object.values(accept).flat()
    return extensions.join(', ').toUpperCase()
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Label */}
      <Label 
        htmlFor={inputId}
        className={cn(
          "text-sm font-medium",
          hasError && "text-destructive",
          hasSuccess && "text-green-600"
        )}
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label={t('required')}>
            *
          </span>
        )}
      </Label>

      {/* Drop Zone */}
      {canUploadMore && (
        <div
          {...getRootProps()}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 cursor-pointer",
            "hover:border-primary hover:bg-primary/5",
            isDragActive && "border-primary bg-primary/10",
            hasError && "border-destructive",
            hasSuccess && "border-green-500",
            !canUploadMore && "opacity-50 cursor-not-allowed"
          )}
        >
          <input 
            {...getInputProps()} 
            id={inputId}
            ref={fileInputRef}
          />
          
          <div className="text-center space-y-4">
            <motion.div
              animate={{ 
                scale: isDragActive ? 1.1 : 1,
                rotate: isDragActive ? 5 : 0 
              }}
              className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center"
            >
              <Upload className="w-8 h-8 text-primary" />
            </motion.div>
            
            <div>
              <p className="text-lg font-medium">
                {isDragActive ? t('dropFiles') : t('dragAndDrop')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('orClickToSelect')}
              </p>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>{t('acceptedTypes')}: {getAcceptedTypesText()}</p>
              <p>{t('maxSize')}: {formatFileSize(maxSize)}</p>
              {multiple && <p>{t('maxFiles')}: {maxFiles}</p>}
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <Label className="text-sm font-medium">
              {t('uploadedFiles')} ({uploadedFiles.length}/{maxFiles})
            </Label>
            
            <div className="space-y-2">
              {uploadedFiles.map((fileObj) => (
                <motion.div
                  key={fileObj.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                >
                  {/* File Icon */}
                  <div className="flex-shrink-0 text-muted-foreground">
                    {getFileIcon(fileObj.file)}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{fileObj.file.name}</p>
                      <Badge variant={
                        fileObj.status === 'completed' ? 'default' :
                        fileObj.status === 'error' ? 'destructive' :
                        fileObj.status === 'uploading' ? 'secondary' :
                        'outline'
                      }>
                        {t(`status.${fileObj.status}`)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(fileObj.file.size)}</span>
                      {fileObj.compressed && fileObj.compressedSize && (
                        <span>
                          → {formatFileSize(fileObj.compressedSize)} 
                          ({Math.round((1 - fileObj.compressedSize / fileObj.file.size) * 100)}% {t('compressed')})
                        </span>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    {fileObj.status === 'uploading' && typeof fileObj.progress === 'number' && (
                      <Progress value={fileObj.progress} className="mt-2 h-1" />
                    )}
                    
                    {/* Error Message */}
                    {fileObj.status === 'error' && fileObj.error && (
                      <p className="text-xs text-destructive mt-1">{fileObj.error}</p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* Preview for images */}
                    {fileObj.status === 'completed' && fileObj.file.type.startsWith('image/') && fileObj.url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(fileObj.url, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {/* Retry */}
                    {fileObj.status === 'error' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => retryUpload(fileObj)}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {/* Remove */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(fileObj.id)}
                      disabled={fileObj.status === 'uploading'}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="space-y-1">
        {/* Error Message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-destructive flex items-center gap-2"
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.p>
        )}

        {/* Success Message */}
        {success && !error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-green-600 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </motion.p>
        )}

        {/* Hint */}
        {hint && !error && !success && (
          <p className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}