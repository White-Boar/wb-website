/**
 * API Route: DELETE /api/onboarding/upload/[id]
 * Deletes an upload and its associated file from storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTestClient } from '@/lib/supabase/server';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const supabase = createTestClient();

    // Get upload record
    const { data: upload, error: fetchError } = await supabase
      .from('onboarding_uploads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !upload) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    // Extract file path from URL
    // URL format: https://...supabase.co/storage/v1/object/public/onboarding-assets/{filePath}
    const urlParts = upload.file_url.split('/onboarding-assets/');
    const filePath = urlParts[1];

    // Delete file from storage (skip in test/dev where storage is mocked)
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

    if (filePath && !isDevelopment) {
      const { error: storageError } = await supabase
        .storage
        .from('onboarding-assets')
        .remove([filePath]);

      if (storageError) {
        console.error('Failed to delete file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete upload record
    const { error: deleteError } = await supabase
      .from('onboarding_uploads')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete upload record:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete upload' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
