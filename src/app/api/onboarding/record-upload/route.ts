import { NextRequest, NextResponse } from 'next/server'
import { OnboardingServerService } from '@/services/onboarding-server'

export async function POST(request: NextRequest) {
  try {
    const {
      sessionId,
      fileType,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      dimensions
    } = await request.json()

    if (!sessionId || !fileType || !fileUrl || !fileName || fileSize === undefined || !mimeType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Record file upload via server service (service role)
    const uploadedFile = await OnboardingServerService.recordFileUpload(
      sessionId,
      fileType,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      dimensions
    )

    return NextResponse.json({
      success: true,
      data: uploadedFile
    })

  } catch (error) {
    console.error('Record upload API error:', error)
    return NextResponse.json(
      { error: 'Failed to record file upload' },
      { status: 500 }
    )
  }
}