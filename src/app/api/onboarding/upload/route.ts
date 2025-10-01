import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const sessionId = formData.get('sessionId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!type) {
      return NextResponse.json(
        { error: 'File type not specified' },
        { status: 400 }
      )
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID not provided' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'image/png',
      'image/jpg',
      'image/jpeg',
      'image/svg+xml'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Only PNG, JPG, JPEG, and SVG files are supported.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${type}-${timestamp}-${randomId}.${fileExtension}`
    const filePath = `${type}/${fileName}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase storage
    const { data, error } = await supabaseAdmin.storage
      .from('onboarding-uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        duplex: 'half'
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('onboarding-uploads')
      .getPublicUrl(data.path)

    const uploadResponse = {
      id: data.id,
      path: data.path,
      url: publicUrlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      fullPath: data.fullPath
    }

    // Record the upload in the database
    try {
      const { OnboardingServerService } = await import('@/services/onboarding-server')
      await OnboardingServerService.recordFileUpload(
        sessionId,
        type === 'business-asset' ? 'photo' : 'logo', // Map type to file_type
        publicUrlData.publicUrl,
        file.name,
        file.size,
        file.type
      )
    } catch (dbError) {
      console.error('Failed to record file upload in database:', dbError)
      // Don't fail the upload if database recording fails
      // File is already in storage, user can still proceed
    }

    return NextResponse.json({
      success: true,
      data: uploadResponse
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during file upload' },
      { status: 500 }
    )
  }
}