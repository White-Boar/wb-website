/**
 * E2E Test: Upload API Route Handlers
 * Tests for file upload and deletion
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'http://localhost:3783';
const uniqueEmail = (base: string) => `test-e2e-${base}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

// Create test image file
function createTestImage(): Buffer {
  // Simple 1x1 PNG (valid PNG header)
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // Rest of IHDR
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d,
    0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, // IEND chunk
    0x44, 0xae, 0x42, 0x60, 0x82
  ]);
}

test.describe('Upload API Routes E2E', () => {
  test.describe('POST /api/onboarding/upload', () => {
    test('should upload logo successfully', async ({ request }) => {
      // Create session
      const email = uniqueEmail('upload-logo');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Create form data with file
      const formData = new FormData();
      formData.append('sessionId', session.id);
      formData.append('fileType', 'logo');
      const imageBuffer = createTestImage();
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      formData.append('file', blob, 'test-logo.png');

      // Upload file
      const response = await request.post(`${API_BASE}/api/onboarding/upload`, {
        multipart: {
          sessionId: session.id,
          fileType: 'logo',
          file: {
            name: 'test-logo.png',
            mimeType: 'image/png',
            buffer: imageBuffer
          }
        }
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.upload.id).toBeDefined();
      expect(data.upload.file_url).toBeDefined();
      expect(data.upload.file_size).toBeGreaterThan(0);
      expect(data.upload.mime_type).toBe('image/png');
      expect(data.upload.virus_scan_status).toBe('pending');
    });

    test('should upload photo successfully', async ({ request }) => {
      // Create session
      const email = uniqueEmail('upload-photo');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Upload file
      const imageBuffer = createTestImage();
      const response = await request.post(`${API_BASE}/api/onboarding/upload`, {
        multipart: {
          sessionId: session.id,
          fileType: 'photo',
          file: {
            name: 'test-photo.png',
            mimeType: 'image/png',
            buffer: imageBuffer
          }
        }
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.upload.id).toBeDefined();
      expect(data.upload.file_type).toBe('photo');
    });

    test('should return 400 for invalid file type', async ({ request }) => {
      // Create session
      const email = uniqueEmail('upload-invalid');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Try to upload invalid file type
      const textBuffer = Buffer.from('Not an image');
      const response = await request.post(`${API_BASE}/api/onboarding/upload`, {
        multipart: {
          sessionId: session.id,
          fileType: 'logo',
          file: {
            name: 'test.txt',
            mimeType: 'text/plain',
            buffer: textBuffer
          }
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('file type');
    });

    test('should return 400 if logo limit exceeded', async ({ request }) => {
      // Create session
      const email = uniqueEmail('upload-logo-limit');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      // Upload first logo
      const imageBuffer = createTestImage();
      await request.post(`${API_BASE}/api/onboarding/upload`, {
        multipart: {
          sessionId: session.id,
          fileType: 'logo',
          file: {
            name: 'logo-1.png',
            mimeType: 'image/png',
            buffer: imageBuffer
          }
        }
      });

      // Try to upload second logo (should fail)
      const secondResponse = await request.post(`${API_BASE}/api/onboarding/upload`, {
        multipart: {
          sessionId: session.id,
          fileType: 'logo',
          file: {
            name: 'logo-2.png',
            mimeType: 'image/png',
            buffer: imageBuffer
          }
        }
      });

      expect(secondResponse.status()).toBe(400);
      const data = await secondResponse.json();
      expect(data.error).toContain('Logo limit');
    });

    test('should return 400 for missing sessionId', async ({ request }) => {
      const imageBuffer = createTestImage();
      const response = await request.post(`${API_BASE}/api/onboarding/upload`, {
        multipart: {
          fileType: 'logo',
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: imageBuffer
          }
        }
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('DELETE /api/onboarding/upload/[id]', () => {
    test('should delete upload successfully', async ({ request }) => {
      // Create session and upload file
      const email = uniqueEmail('delete');
      const createResponse = await request.post(`${API_BASE}/api/onboarding/session`, {
        data: { locale: 'en', email }
      });
      const { session } = await createResponse.json();

      const imageBuffer = createTestImage();
      const uploadResponse = await request.post(`${API_BASE}/api/onboarding/upload`, {
        multipart: {
          sessionId: session.id,
          fileType: 'photo',
          file: {
            name: 'test-delete.png',
            mimeType: 'image/png',
            buffer: imageBuffer
          }
        }
      });
      const { upload } = await uploadResponse.json();

      // Delete upload
      const deleteResponse = await request.delete(`${API_BASE}/api/onboarding/upload/${upload.id}`);

      expect(deleteResponse.status()).toBe(200);
      const data = await deleteResponse.json();
      expect(data.success).toBe(true);
    });

    test('should return 404 for non-existent upload', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/api/onboarding/upload/00000000-0000-0000-0000-000000000000`);

      expect(response.status()).toBe(404);
    });
  });
});
