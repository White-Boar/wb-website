import { track } from '@vercel/analytics'
import {
  AnalyticsEventType,
  AnalyticsCategory,
  StepNumber,
  OnboardingFormData
} from '@/types/onboarding'

// =============================================================================
// ANALYTICS SERVICE CLASS
// =============================================================================

export class AnalyticsService {

  // ===========================================================================
  // HELPER FUNCTIONS
  // ===========================================================================

  /**
   * Track analytics event via API route (uses service role on server)
   */
  private static async trackEventViaAPI(
    sessionId: string,
    eventType: AnalyticsEventType,
    metadata: Record<string, any> = {},
    stepNumber?: number,
    fieldName?: string,
    category: string = 'user_action',
    durationMs?: number
  ): Promise<void> {
    try {
      // Don't wait for analytics calls to complete - fire and forget
      fetch('/api/onboarding/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          eventType,
          metadata,
          stepNumber,
          fieldName,
          category,
          durationMs
        })
      }).catch(error => {
        // Silent fail for analytics - don't break user flow
        console.warn('Analytics tracking failed:', error)
      })
    } catch (error) {
      // Silent fail for analytics
      console.warn('Analytics tracking failed:', error)
    }
  }

  // ===========================================================================
  // PERFORMANCE TRACKING
  // ===========================================================================

  /**
   * Track page load performance
   */
  static trackPageLoad(
    sessionId: string,
    loadTime: number,
    stepNumber?: number
  ): void {
    // Track with Vercel Analytics
    track('onboarding_page_load', {
      step: stepNumber || 'initial',
      load_time_ms: loadTime,
      performance_grade: this.getPerformanceGrade(loadTime)
    })

    // Track in database for funnel analysis
    if (sessionId) {
      this.trackEventViaAPI(
        sessionId,
        'step_view',
        {
          load_time_ms: loadTime,
          performance_grade: this.getPerformanceGrade(loadTime)
        },
        stepNumber,
        undefined,
        'performance',
        loadTime
      )
    }
  }

  /**
   * Track step transition performance
   */
  static trackStepTransition(
    sessionId: string,
    fromStep: number,
    toStep: number,
    transitionTime: number
  ): void {
    const isBackward = toStep < fromStep
    
    // Track with Vercel Analytics
    track('onboarding_step_transition', {
      from_step: fromStep,
      to_step: toStep,
      transition_time_ms: transitionTime,
      direction: isBackward ? 'backward' : 'forward',
      performance_grade: this.getPerformanceGrade(transitionTime)
    })

    // Track in database
    this.trackEventViaAPI(
      sessionId,
      isBackward ? 'navigation_back' : 'navigation_forward',
      {
        from_step: fromStep,
        to_step: toStep,
        transition_time_ms: transitionTime,
        direction: isBackward ? 'backward' : 'forward'
      },
      toStep,
      undefined,
      'performance',
      transitionTime
    )
  }

  // ===========================================================================
  // USER BEHAVIOR TRACKING
  // ===========================================================================

  /**
   * Track step completion
   */
  static trackStepComplete(
    sessionId: string,
    stepNumber: StepNumber,
    timeSpentSeconds: number,
    formData?: Partial<OnboardingFormData>
  ): void {
    const metadata = {
      time_spent_seconds: timeSpentSeconds,
      completion_rate_so_far: (stepNumber / 12) * 100,
      data_completeness: formData ? this.calculateDataCompleteness(formData, stepNumber) : 0
    }

    // Track with Vercel Analytics
    track('onboarding_step_completed', {
      step_number: stepNumber,
      ...metadata
    })

    // Track in database
    this.trackEventViaAPI(
      sessionId,
      'step_complete',
      metadata,
      stepNumber,
      undefined,
      'user_action',
      timeSpentSeconds * 1000
    )
  }

  /**
   * Track field interactions
   */
  static trackFieldInteraction(
    sessionId: string,
    stepNumber: StepNumber,
    fieldName: string,
    eventType: 'focus' | 'blur' | 'change',
    timeSpentMs?: number
  ): void {
    // Only track for significant interactions (not every keystroke)
    if (eventType === 'blur' && timeSpentMs && timeSpentMs > 1000) {
      this.trackEventViaAPI(
        sessionId,
        'field_blur',
        {
          time_spent_ms: timeSpentMs,
          field_interaction_depth: timeSpentMs > 10000 ? 'deep' : 'shallow'
        },
        stepNumber,
        fieldName,
        'user_action',
        timeSpentMs
      )
    }
  }

  /**
   * Track form errors
   */
  static trackFormError(
    sessionId: string,
    stepNumber: StepNumber,
    fieldName: string,
    errorMessage: string,
    errorCode?: string
  ): void {
    // Track with Vercel Analytics
    track('onboarding_form_error', {
      step_number: stepNumber,
      field_name: fieldName,
      error_code: errorCode || 'validation_error'
    })

    // Track in database
    this.trackEventViaAPI(
      sessionId,
      'field_error',
      {
        error_message: errorMessage,
        error_code: errorCode || 'validation_error',
        field_name: fieldName
      },
      stepNumber,
      fieldName,
      'error'
    )
  }

  /**
   * Track abandonment events
   */
  static trackAbandonment(
    sessionId: string,
    stepNumber: StepNumber,
    timeSpentTotal: number,
    reason?: 'session_timeout' | 'user_close' | 'navigation_away'
  ): void {
    const abandonmentData = {
      abandonment_step: stepNumber,
      time_spent_total_seconds: Math.floor(timeSpentTotal / 1000),
      completion_percentage: (stepNumber / 12) * 100,
      reason: reason || 'unknown'
    }

    // Track with Vercel Analytics
    track('onboarding_abandoned', abandonmentData)

    // Track in database
    this.trackEventViaAPI(
      sessionId,
      'session_abandon',
      abandonmentData,
      stepNumber,
      undefined,
      'user_action'
    )
  }

  // ===========================================================================
  // EMAIL & VERIFICATION TRACKING
  // ===========================================================================

  /**
   * Track email verification flow
   */
  static trackEmailVerification(
    sessionId: string,
    eventType: 'code_sent' | 'code_entered' | 'verification_success' | 'verification_failed' | 'max_attempts',
    metadata: Record<string, any> = {}
  ): void {
    const eventMapping: Record<string, AnalyticsEventType> = {
      code_sent: 'email_verification_sent',
      code_entered: 'email_verification_sent',
      verification_success: 'email_verification_success',
      verification_failed: 'email_verification_failed',
      max_attempts: 'email_verification_failed'
    }

    // Track with Vercel Analytics
    track('onboarding_email_verification', {
      event_type: eventType,
      ...metadata
    })

    // Track in database
    this.trackEventViaAPI(
      sessionId,
      eventMapping[eventType] || 'email_verification_sent',
      metadata,
      2, // Email verification is step 2
      undefined,
      'user_action'
    )
  }

  // ===========================================================================
  // FILE UPLOAD TRACKING
  // ===========================================================================

  /**
   * Track file upload events
   */
  static trackFileUpload(
    sessionId: string,
    eventType: 'upload_start' | 'upload_success' | 'upload_error',
    fileType: 'logo' | 'photo',
    metadata: Record<string, any> = {}
  ): void {
    const eventMapping: Record<string, AnalyticsEventType> = {
      upload_start: 'file_upload_start',
      upload_success: 'file_upload_success',
      upload_error: 'file_upload_error'
    }

    // Track with Vercel Analytics
    track('onboarding_file_upload', {
      event_type: eventType,
      file_type: fileType,
      ...metadata
    })

    // Track in database
    this.trackEventViaAPI(
      sessionId,
      eventMapping[eventType],
      { file_type: fileType, ...metadata },
      12, // File uploads are in step 12
      `${fileType}_upload`,
      eventType === 'upload_error' ? 'error' : 'user_action'
    )
  }

  // ===========================================================================
  // COMPLETION & CONVERSION TRACKING
  // ===========================================================================

  /**
   * Track onboarding completion
   */
  static trackOnboardingCompletion(
    sessionId: string,
    totalTimeMinutes: number,
    formData: OnboardingFormData
  ): void {
    const completionData = {
      total_time_minutes: totalTimeMinutes,
      business_industry: formData.industry,
      design_style: formData.designStyle,
      image_style: formData.imageStyle,
      color_palette: formData.colorPalette,
      website_sections_count: formData.websiteSections.length,
      primary_goal: formData.primaryGoal,
      has_logo_upload: !!formData.logoUpload,
      has_business_photos: (formData.businessPhotos?.length || 0) > 0,
      offering_type: formData.offeringType,
      locale: 'it' // Assume Italian for now
    }

    // Track with Vercel Analytics
    track('onboarding_completed', completionData)

    // Track in database
    this.trackEventViaAPI(
      sessionId,
      'form_submit',
      completionData,
      12,
      undefined,
      'user_action',
      totalTimeMinutes * 60 * 1000
    )
  }

  /**
   * Track conversion funnel metrics
   */
  static trackConversionFunnel(
    sessionId: string,
    currentStep: StepNumber,
    totalSessions: number
  ): void {
    const funnelData = {
      current_step: currentStep,
      step_completion_rate: (currentStep / 12) * 100,
      total_sessions_today: totalSessions
    }

    // Track with Vercel Analytics for funnel analysis
    track('onboarding_funnel_progress', funnelData)
  }

  // ===========================================================================
  // TECHNICAL PERFORMANCE TRACKING
  // ===========================================================================

  /**
   * Track API performance
   */
  static trackAPIPerformance(
    sessionId: string,
    operation: string,
    duration: number,
    success: boolean,
    errorCode?: string
  ): void {
    const performanceData = {
      operation,
      duration_ms: duration,
      success,
      error_code: errorCode,
      performance_grade: this.getPerformanceGrade(duration)
    }

    // Track with Vercel Analytics
    track('onboarding_api_performance', performanceData)

    // Track significant slow operations in database
    if (duration > 2000 || !success) {
      this.trackEventViaAPI(
        sessionId,
        success ? 'auto_save' : 'form_error',
        performanceData,
        undefined,
        undefined,
        success ? 'performance' : 'error',
        duration
      )
    }
  }

  /**
   * Track browser compatibility issues
   */
  static trackCompatibilityIssue(
    sessionId: string,
    issue: string,
    userAgent: string,
    metadata: Record<string, any> = {}
  ): void {
    const compatibilityData = {
      issue,
      user_agent: userAgent,
      ...metadata
    }

    // Track with Vercel Analytics
    track('onboarding_compatibility_issue', compatibilityData)

    // Track in database
    this.trackEventViaAPI(
      sessionId,
      'form_error',
      compatibilityData,
      undefined,
      undefined,
      'error'
    )
  }

  // ===========================================================================
  // SESSION & RECOVERY TRACKING
  // ===========================================================================

  /**
   * Track session recovery events
   */
  static trackSessionRecovery(
    sessionId: string,
    recoveryType: 'auto_recovery' | 'manual_recovery' | 'email_recovery',
    stepsRecovered: number,
    dataLoss: boolean
  ): void {
    const recoveryData = {
      recovery_type: recoveryType,
      steps_recovered: stepsRecovered,
      data_loss: dataLoss,
      recovery_success: stepsRecovered > 0
    }

    // Track with Vercel Analytics
    track('onboarding_session_recovery', recoveryData)

    // Track in database
    this.trackEventViaAPI(
      sessionId,
      'session_recovered',
      recoveryData,
      undefined,
      undefined,
      'system_event'
    )
  }

  /**
   * Track auto-save performance
   */
  static trackAutoSave(
    sessionId: string,
    stepNumber: StepNumber,
    saveTime: number,
    success: boolean,
    dataSize?: number
  ): void {
    const autoSaveData = {
      save_time_ms: saveTime,
      success,
      data_size_bytes: dataSize,
      performance_grade: this.getPerformanceGrade(saveTime)
    }

    // Only track slow or failed saves
    if (saveTime > 1000 || !success) {
      track('onboarding_auto_save', {
        step_number: stepNumber,
        ...autoSaveData
      })

      this.trackEventViaAPI(
        sessionId,
        success ? 'auto_save' : 'form_error',
        autoSaveData,
        stepNumber,
        undefined,
        success ? 'performance' : 'error',
        saveTime
      )
    }
  }

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================

  /**
   * Calculate data completeness percentage for a step
   */
  private static calculateDataCompleteness(
    formData: Partial<OnboardingFormData>,
    stepNumber: StepNumber
  ): number {
    const requiredFields = this.getRequiredFieldsForStep(stepNumber)
    const completedFields = requiredFields.filter(field => {
      const value = this.getNestedValue(formData, field)
      return value !== undefined && value !== null && value !== ''
    })

    return Math.round((completedFields.length / requiredFields.length) * 100)
  }

  /**
   * Get required fields for a specific step
   */
  private static getRequiredFieldsForStep(stepNumber: StepNumber): string[] {
    const fieldMap: Record<StepNumber, string[]> = {
      1: ['name', 'email'],
      2: ['emailVerified'],
      3: ['businessName', 'businessEmail', 'businessPhone', 'physicalAddress', 'industry'],
      4: ['offer', 'competitors', 'uniqueness'],
      5: ['customerProfile'],
      6: ['problemSolved', 'customerDelight'],
      7: ['websiteReferences'],
      8: ['designStyle'],
      9: ['imageStyle'],
      10: ['colorPalette'],
      11: ['websiteSections', 'primaryGoal'],
      12: [] // Optional uploads
    }

    return fieldMap[stepNumber] || []
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Get performance grade based on timing
   */
  private static getPerformanceGrade(timeMs: number): 'excellent' | 'good' | 'poor' | 'critical' {
    if (timeMs < 500) return 'excellent'
    if (timeMs < 1500) return 'good'
    if (timeMs < 3000) return 'poor'
    return 'critical'
  }

  // ===========================================================================
  // BATCH TRACKING FOR PERFORMANCE
  // ===========================================================================

  private static eventQueue: Array<{
    sessionId: string
    eventType: AnalyticsEventType
    metadata: Record<string, any>
    stepNumber?: StepNumber
    timestamp: number
  }> = []

  /**
   * Queue event for batch processing
   */
  static queueEvent(
    sessionId: string,
    eventType: AnalyticsEventType,
    metadata: Record<string, any> = {},
    stepNumber?: StepNumber
  ): void {
    this.eventQueue.push({
      sessionId,
      eventType,
      metadata,
      stepNumber,
      timestamp: Date.now()
    })

    // Process queue when it gets large enough
    if (this.eventQueue.length >= 10) {
      this.flushEventQueue()
    }
  }

  /**
   * Flush queued events to database
   */
  static async flushEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue.length = 0 // Clear queue

    try {
      // Process events in batches
      await Promise.all(
        events.map(event =>
          this.trackEventViaAPI(
            event.sessionId,
            event.eventType,
            { ...event.metadata, queued_at: event.timestamp },
            event.stepNumber
          )
        )
      )
    } catch (error) {
      console.error('Failed to flush event queue:', error)
      // Re-add events to queue for retry
      this.eventQueue.unshift(...events)
    }
  }

  /**
   * Set up automatic queue flushing
   */
  static initializeAutoFlush(): void {
    // Flush queue every 30 seconds
    setInterval(() => {
      this.flushEventQueue()
    }, 30000)

    // Flush queue on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushEventQueue()
      })
    }
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS FOR COMMON TRACKING SCENARIOS
// =============================================================================

/**
 * Track when user starts onboarding
 */
export function trackOnboardingStart(sessionId: string): void {
  AnalyticsService.trackPageLoad(sessionId, performance.now(), 1)
  track('onboarding_started')
}

/**
 * Track when user navigates between steps
 */
export function trackStepNavigation(
  sessionId: string,
  fromStep: number,
  toStep: number
): void {
  const transitionTime = performance.now()
  AnalyticsService.trackStepTransition(sessionId, fromStep, toStep, transitionTime)
}

/**
 * Track form validation errors
 */
export function trackValidationError(
  sessionId: string,
  stepNumber: StepNumber,
  fieldName: string,
  errorMessage: string
): void {
  AnalyticsService.trackFormError(sessionId, stepNumber, fieldName, errorMessage)
}

/**
 * Track successful onboarding completion
 */
export function trackCompletionSuccess(
  sessionId: string,
  formData: OnboardingFormData,
  totalTimeMs: number
): void {
  const totalTimeMinutes = Math.round(totalTimeMs / 60000)
  AnalyticsService.trackOnboardingCompletion(sessionId, totalTimeMinutes, formData)
}

/**
 * Initialize analytics with auto-flush
 */
export function initializeAnalytics(): void {
  AnalyticsService.initializeAutoFlush()
  console.log('WhiteBoar Analytics initialized with auto-flush')
}

// Export the main service
export default AnalyticsService