/**
 * API Route: POST /api/onboarding/upload
 * Handles file uploads for onboarding (logos and photos)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTestClient } from '@/lib/supabase/server';

// File type configurations
const FILE_TYPE_CONFIG = {
  logo: {
    maxCount: 1,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  photo: {
    maxCount: 30,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string;
    const fileType = formData.get('fileType') as string;
    const file = formData.get('file') as File;

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    if (!fileType || !['logo', 'photo'].includes(fileType)) {
      return NextResponse.json(
        { error: 'fileType must be "logo" or "photo"' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'file is required' },
        { status: 400 }
      );
    }

    const supabase = createTestClient();

    // Verify session exists
    const { data: session, error: sessionError } = await supabase
      .from('onboarding_sessions')
      .select('id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get file type config
    const config = FILE_TYPE_CONFIG[fileType as keyof typeof FILE_TYPE_CONFIG];

    // Validate file type
    if (!config.allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. ${fileType === 'logo' ? 'Logos' : 'Photos'} must be ${config.allowedMimeTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > config.maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${config.maxSize / (1024 * 1024)}MB limit` },
        { status: 400 }
      );
    }

    // Check upload count limit
    const { count, error: countError } = await supabase
      .from('onboarding_uploads')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('file_type', fileType);

    if (countError) {
      console.error('Failed to count uploads:', countError);
      return NextResponse.json(
        { error: 'Failed to check upload limit' },
        { status: 500 }
      );
    }

    if ((count ?? 0) >= config.maxCount) {
      return NextResponse.json(
        { error: `${fileType === 'logo' ? 'Logo' : 'Photo'} limit exceeded. Maximum ${config.maxCount} ${fileType === 'logo' ? 'logo' : 'photos'} allowed.` },
        { status: 400 }
      );
    }

    // Generate file path
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${sessionId}/${fileType}-${timestamp}-${sanitizedFilename}`;

    // Mock file URL for test environments (bucket may not exist)
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    let publicUrl: string;

    if (isDevelopment) {
      // Mock storage for test environments
      publicUrl = `https://mock-storage.supabase.co/storage/v1/object/public/onboarding-assets/${filePath}`;
    } else {
      // Upload to Supabase Storage (production)
      const fileBuffer = await file.arrayBuffer();
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('onboarding-assets')
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Failed to upload file to storage:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload file' },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: { publicUrl: url } } = supabase
        .storage
        .from('onboarding-assets')
        .getPublicUrl(filePath);

      publicUrl = url;
    }

    // Extract image dimensions (for images only)
    let width: number | null = null;
    let height: number | null = null;

    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      try {
        // In a real implementation, you'd use a library like sharp or image-size
        // For now, we'll leave dimensions as null
        // This would require additional dependencies for proper implementation
      } catch (error) {
        console.error('Failed to extract image dimensions:', error);
      }
    }

    // Create upload record
    const { data: upload, error: createError } = await supabase
      .from('onboarding_uploads')
      .insert({
        session_id: sessionId,
        file_type: fileType,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        width,
        height,
        virus_scan_status: 'pending',
      })
      .select()
      .single();

    if (createError || !upload) {
      console.error('Failed to create upload record:', createError);

      // Clean up uploaded file (only in production where file was actually uploaded)
      if (!isDevelopment) {
        await supabase.storage.from('onboarding-assets').remove([filePath]);
      }

      return NextResponse.json(
        { error: 'Failed to create upload record' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { upload },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
