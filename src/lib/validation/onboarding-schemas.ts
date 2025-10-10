/**
 * Onboarding System v3 - Zod Validation Schemas
 *
 * This file contains Zod schemas for all onboarding steps.
 * For the foundation sprint, we define basic schemas for the welcome flow.
 * Full schemas for Steps 1-12 will be added in future sprints.
 */

import { z } from 'zod';

// ============================================================================
// Foundation Sprint Schemas
// ============================================================================

/**
 * Schema for the welcome page (no validation needed for foundation sprint)
 */
export const welcomeSchema = z.object({});

/**
 * Schema for session metadata (Zustand store)
 */
export const sessionMetadataSchema = z.object({
  sessionId: z.string().uuid().nullable(),
  currentStep: z.number().min(1).max(13),
  lastSaved: z.string().datetime().nullable(),
});

// ============================================================================
// Future Step Schemas (Placeholders)
// ============================================================================

/**
 * Step 1 - Personal Information
 * Will be fully implemented in future sprints
 */
export const step1Schema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
});

/**
 * Step 3 - Business Basics (partial for reference)
 */
export const step3Schema = z.object({
  businessName: z.string().min(2).max(50),
  businessEmail: z.string().email(),
  businessPhone: z.string(),
  physicalAddressStreet: z.string().optional(),
  physicalAddressCity: z.string().optional(),
  physicalAddressProvince: z.string().optional(),
  physicalAddressPostalCode: z.string().optional(),
  physicalAddressCountry: z.string().optional(),
  physicalAddressPlaceId: z.string().optional(),
  industry: z.string(),
  vatNumber: z.string().optional(),
});

// Additional step schemas will be added in future sprints

// ============================================================================
// Export Types from Schemas
// ============================================================================

export type WelcomeData = z.infer<typeof welcomeSchema>;
export type SessionMetadata = z.infer<typeof sessionMetadataSchema>;
export type Step1Data = z.infer<typeof step1Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
