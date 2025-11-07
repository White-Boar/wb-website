import { Resend } from 'resend'
import { OnboardingFormData, EmailVerificationResponse } from '@/types/onboarding'
import { CustomSoftwareFormData } from '@/types/custom-software'

// =============================================================================
// RESEND EMAIL SERVICE CONFIGURATION
// =============================================================================

const resend = new Resend(process.env.RESEND_API_KEY || process.env.RESEND_KEY)

// Email configuration from environment
const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || (process.env.NODE_ENV === 'development' ? 'onboarding@resend.dev' : 'noreply@notifications.whiteboar.it')
const FROM_NAME = process.env.FROM_NAME || 'WhiteBoar'
const ADMIN_EMAIL = process.env.NOTIFICATION_ADMIN_EMAIL || 'admin@whiteboar.it'
const SUPPORT_EMAIL = process.env.NOTIFICATION_SUPPORT_EMAIL || 'info@whiteboar.it'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://whiteboar.it'

// Test mode configuration - skip sending real emails in dev/test/CI unless explicitly enabled
const ENABLE_EMAILS = process.env.ENABLE_EMAILS === 'true'
const SHOULD_SKIP_BY_DEFAULT =
  process.env.NODE_ENV === 'test' ||
  process.env.NODE_ENV === 'development' ||
  process.env.CI === 'true'
const IS_TEST_MODE = !ENABLE_EMAILS && SHOULD_SKIP_BY_DEFAULT

// Validate Resend API key (only warn in production)
if (!process.env.RESEND_API_KEY && !process.env.RESEND_KEY && process.env.NODE_ENV === 'production') {
  console.error('ERROR: RESEND_API_KEY or RESEND_KEY environment variable is not set in production')
}

/**
 * Sanitize a string for use as a Resend email tag value.
 * Resend requires tags to only contain ASCII letters, numbers, underscores, or dashes.
 */
function sanitizeTagValue(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 256) // Resend has a 256 char limit per tag value
}

// =============================================================================
// EMAIL SERVICE CLASS
// =============================================================================

export class EmailService {

  // ===========================================================================
  // VERIFICATION EMAILS
  // ===========================================================================

  /**
   * Send email verification code
   */
  static async sendVerificationEmail(
    email: string,
    name: string,
    verificationCode: string,
    locale: 'en' | 'it' = 'en'
  ): Promise<EmailVerificationResponse> {
    try {
      const subject = locale === 'it' 
        ? 'Codice di verifica WhiteBoar'
        : 'WhiteBoar Verification Code'

      const htmlContent = this.generateVerificationEmailHTML(
        name,
        verificationCode,
        locale
      )

      const textContent = this.generateVerificationEmailText(
        name,
        verificationCode,
        locale
      )

      // Skip sending emails in test mode
      if (IS_TEST_MODE) {
        console.log('[TEST MODE] Skipping verification email send:', {
          to: email,
          subject,
          verificationCode
        })
        return {
          success: true,
          data: {
            sent: true,
            attemptsRemaining: 5
          }
        }
      }

      const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'category', value: 'verification' },
          { name: 'locale', value: locale }
        ]
      })

      if (error) {
        console.error('Resend error:', error)
        return {
          success: false,
          error: {
            message: 'Failed to send verification email',
            code: 'EMAIL_SEND_FAILED',
            details: error
          },
          data: {
            sent: false,
            attemptsRemaining: 0
          }
        }
      }

      console.log('Verification email sent successfully:', data)
      
      return {
        success: true,
        data: {
          sent: true,
          attemptsRemaining: 5 // Default attempts
        }
      }
    } catch (error) {
      console.error('Send verification email error:', error)
      
      return {
        success: false,
        error: {
          message: 'Failed to send verification email',
          code: 'EMAIL_SERVICE_ERROR',
          details: error
        },
        data: {
          sent: false,
          attemptsRemaining: 0
        }
      }
    }
  }

  // ===========================================================================
  // COMPLETION & NOTIFICATION EMAILS
  // ===========================================================================

  /**
   * Send completion confirmation to user
   */
  static async sendCompletionConfirmation(
    email: string,
    businessName: string,
    locale: 'en' | 'it' = 'en'
  ): Promise<boolean> {
    try {
      const subject = locale === 'it'
        ? `Grazie ${businessName}! La tua richiesta è stata ricevuta`
        : `Thank you ${businessName}! Your request has been received`

      const htmlContent = this.generateCompletionEmailHTML(businessName, locale)
      const textContent = this.generateCompletionEmailText(businessName, locale)

      // Skip sending emails in test mode
      if (IS_TEST_MODE) {
        console.log('[TEST MODE] Skipping completion confirmation email:', {
          to: email,
          subject,
          businessName
        })
        return true
      }

      const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'category', value: 'completion' },
          { name: 'locale', value: locale }
        ]
      })

      if (error) {
        console.error('Failed to send completion confirmation:', error)
        return false
      }

      console.log('Completion confirmation sent:', data)
      return true
    } catch (error) {
      console.error('Send completion confirmation error:', error)
      return false
    }
  }

  /**
   * Send admin notification for new submission
   */
  static async sendAdminNotification(
    formData: OnboardingFormData,
    submissionId: string
  ): Promise<boolean> {
    try {
      const subject = `New Onboarding Submission: ${formData.businessName}`

      const htmlContent = this.generateAdminNotificationHTML(formData, submissionId)
      const textContent = this.generateAdminNotificationText(formData, submissionId)

      // Skip sending emails in test mode
      if (IS_TEST_MODE) {
        console.log('[TEST MODE] Skipping admin notification email:', {
          to: ADMIN_EMAIL,
          subject,
          submissionId
        })
        return true
      }

      const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [ADMIN_EMAIL],
        subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'category', value: 'admin_notification' },
          { name: 'business_name', value: sanitizeTagValue(formData.businessName) }
        ]
      })

      if (error) {
        console.error('Failed to send admin notification:', error)
        return false
      }

      console.log('Admin notification sent:', data)
      return true
    } catch (error) {
      console.error('Send admin notification error:', error)
      return false
    }
  }

  /**
   * Send preview ready notification
   */
  static async sendPreviewNotification(
    email: string,
    businessName: string,
    previewUrl: string,
    locale: 'en' | 'it' = 'en'
  ): Promise<boolean> {
    try {
      const subject = locale === 'it'
        ? `${businessName} - La tua anteprima è pronta!`
        : `${businessName} - Your preview is ready!`

      const htmlContent = this.generatePreviewEmailHTML(businessName, previewUrl, locale)
      const textContent = this.generatePreviewEmailText(businessName, previewUrl, locale)

      // Skip sending emails in test mode
      if (IS_TEST_MODE) {
        console.log('[TEST MODE] Skipping preview notification email:', {
          to: email,
          subject,
          businessName,
          previewUrl
        })
        return true
      }

      const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'category', value: 'preview_ready' },
          { name: 'locale', value: locale }
        ]
      })

      if (error) {
        console.error('Failed to send preview notification:', error)
        return false
      }

      console.log('Preview notification sent:', data)
      return true
    } catch (error) {
      console.error('Send preview notification error:', error)
      return false
    }
  }

  /**
   * Send abandonment recovery email
   */
  static async sendAbandonmentRecovery(
    email: string,
    name: string,
    sessionId: string,
    currentStep: number,
    locale: 'en' | 'it' = 'en'
  ): Promise<boolean> {
    try {
      const subject = locale === 'it'
        ? 'Non perdere la tua creazione WhiteBoar'
        : "Don't lose your WhiteBoar creation"

      const recoveryUrl = `${APP_URL}/onboarding?session=${sessionId}`

      const htmlContent = this.generateRecoveryEmailHTML(name, recoveryUrl, currentStep, locale)
      const textContent = this.generateRecoveryEmailText(name, recoveryUrl, currentStep, locale)

      // Skip sending emails in test mode
      if (IS_TEST_MODE) {
        console.log('[TEST MODE] Skipping abandonment recovery email:', {
          to: email,
          subject,
          sessionId,
          currentStep
        })
        return true
      }

      const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'category', value: 'abandonment_recovery' },
          { name: 'locale', value: locale },
          { name: 'step', value: currentStep.toString() }
        ]
      })

      if (error) {
        console.error('Failed to send abandonment recovery:', error)
        return false
      }

      console.log('Abandonment recovery email sent:', data)
      return true
    } catch (error) {
      console.error('Send abandonment recovery error:', error)
      return false
    }
  }

  // ===========================================================================
  // HTML EMAIL TEMPLATES
  // ===========================================================================

  private static generateVerificationEmailHTML(
    name: string,
    code: string,
    locale: 'en' | 'it'
  ): string {
    const content = locale === 'it' ? {
      greeting: `Ciao ${name},`,
      message: 'Ecco il tuo codice di verifica per continuare la creazione del tuo sito web WhiteBoar:',
      codeLabel: 'Il tuo codice:',
      instructions: 'Inserisci questo codice nella pagina di verifica per continuare.',
      expires: 'Questo codice scade tra 15 minuti.',
      support: 'Hai bisogno di aiuto?',
      contactUs: 'Contattaci',
      thanks: 'Grazie,<br>Il team WhiteBoar'
    } : {
      greeting: `Hello ${name},`,
      message: 'Here\'s your verification code to continue creating your WhiteBoar website:',
      codeLabel: 'Your code:',
      instructions: 'Enter this code on the verification page to continue.',
      expires: 'This code expires in 15 minutes.',
      support: 'Need help?',
      contactUs: 'Contact us',
      thanks: 'Thanks,<br>The WhiteBoar Team'
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${locale === 'it' ? 'Codice di verifica WhiteBoar' : 'WhiteBoar Verification Code'}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .code-container { text-align: center; margin: 30px 0; }
            .code { display: inline-block; background: #f8f9fa; border: 2px dashed #667eea; padding: 20px 30px; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #667eea; border-radius: 8px; }
            .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🐗 WhiteBoar</div>
              <div>${locale === 'it' ? 'Codice di Verifica' : 'Verification Code'}</div>
            </div>
            <div class="content">
              <p>${content.greeting}</p>
              <p>${content.message}</p>
              
              <div class="code-container">
                <div style="font-weight: bold; margin-bottom: 10px; color: #667eea;">${content.codeLabel}</div>
                <div class="code">${code}</div>
              </div>
              
              <p>${content.instructions}</p>
              <p style="color: #666; font-size: 14px;"><em>${content.expires}</em></p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p>${content.support} <a href="mailto:${SUPPORT_EMAIL}" class="button">${content.contactUs}</a></p>
              
              <p>${content.thanks}</p>
            </div>
            <div class="footer">
              <p>WhiteBoar - AI-driven digital agency<br>
              <a href="${APP_URL}">${APP_URL}</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private static generateCompletionEmailHTML(
    businessName: string,
    locale: 'en' | 'it'
  ): string {
    const content = locale === 'it' ? {
      title: 'Richiesta Ricevuta!',
      greeting: `Ciao ${businessName}!`,
      message: 'Abbiamo ricevuto la tua richiesta per la creazione del sito web. Il nostro team inizierà a lavorare sulla tua anteprima personalizzata.',
      timeline: 'La tua anteprima sarà pronta in <strong>5 giorni lavorativi</strong>.',
      notification: 'Ti invieremo un\'email quando sarà pronta per la revisione.',
      payment: 'Il pagamento sarà richiesto solo dopo aver approvato l\'anteprima.',
      questions: 'Hai domande? Siamo qui per aiutarti.',
      thanks: 'Grazie per aver scelto WhiteBoar!'
    } : {
      title: 'Request Received!',
      greeting: `Hello ${businessName}!`,
      message: 'We\'ve received your request for website creation. Our team will start working on your custom preview.',
      timeline: 'Your preview will be ready in <strong>5 business days</strong>.',
      notification: 'We\'ll send you an email when it\'s ready for review.',
      payment: 'Payment will only be required after you approve the preview.',
      questions: 'Have questions? We\'re here to help.',
      thanks: 'Thank you for choosing WhiteBoar!'
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${content.title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .highlight { background: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 14px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🐗 WhiteBoar</div>
              <div>${content.title}</div>
            </div>
            <div class="content">
              <p style="font-size: 18px;">${content.greeting}</p>
              
              <p>${content.message}</p>
              
              <div class="highlight">
                <p style="margin: 0; font-size: 18px;">${content.timeline}</p>
              </div>
              
              <p>${content.notification}</p>
              <p>${content.payment}</p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p>${content.questions} <a href="mailto:${SUPPORT_EMAIL}" class="button">${locale === 'it' ? 'Contattaci' : 'Contact Us'}</a></p>
              
              <p style="font-size: 18px; color: #10b981;"><strong>${content.thanks}</strong></p>
            </div>
            <div class="footer">
              <p>WhiteBoar - AI-driven digital agency<br>
              <a href="${APP_URL}">${APP_URL}</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private static generateAdminNotificationHTML(
    formData: OnboardingFormData,
    submissionId: string
  ): string {
    const adminUrl = `${APP_URL}/admin/submissions/${submissionId}`
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Onboarding Submission</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: #1f2937; color: white; padding: 30px; }
            .content { padding: 30px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-item { background: #f8f9fa; padding: 15px; border-radius: 4px; }
            .info-label { font-weight: bold; color: #374151; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 New Onboarding Submission</h1>
              <p>A new business has completed the onboarding process!</p>
            </div>
            <div class="content">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Business Name</div>
                  <div>${formData.businessName}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Contact Email</div>
                  <div>${formData.businessEmail}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Phone</div>
                  <div>${formData.businessPhone}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Industry</div>
                  <div>${formData.industry}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Location</div>
                  <div>${formData.businessCity || 'N/A'}, ${formData.businessProvince || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Primary Goal</div>
                  <div>${formData.primaryGoal}</div>
                </div>
              </div>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <strong>Business Offer:</strong><br>
                ${formData.businessDescription}
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Review the complete submission in the admin panel</li>
                <li>Begin creating the website preview</li>
                <li>Send preview notification when ready</li>
              </ol>
              
              <p style="text-align: center;">
                <a href="${adminUrl}" class="button">View Full Submission</a>
              </p>
            </div>
            <div class="footer">
              <p>WhiteBoar Admin Panel<br>
              Submission ID: ${submissionId}</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  // ===========================================================================
  // TEXT EMAIL TEMPLATES (Fallback for HTML)
  // ===========================================================================

  private static generateVerificationEmailText(
    name: string,
    code: string,
    locale: 'en' | 'it'
  ): string {
    return locale === 'it' 
      ? `Ciao ${name},\n\nEcco il tuo codice di verifica WhiteBoar: ${code}\n\nInserisci questo codice per continuare la creazione del tuo sito web.\n\nIl codice scade tra 15 minuti.\n\nHai bisogno di aiuto? Contattaci: ${SUPPORT_EMAIL}\n\nGrazie,\nIl team WhiteBoar`
      : `Hello ${name},\n\nYour WhiteBoar verification code is: ${code}\n\nEnter this code to continue creating your website.\n\nThis code expires in 15 minutes.\n\nNeed help? Contact us: ${SUPPORT_EMAIL}\n\nThanks,\nThe WhiteBoar Team`
  }

  private static generateCompletionEmailText(
    businessName: string,
    locale: 'en' | 'it'
  ): string {
    return locale === 'it'
      ? `Ciao ${businessName}!\n\nAbbiamo ricevuto la tua richiesta per la creazione del sito web.\n\nLa tua anteprima sarà pronta in 5 giorni lavorativi. Ti invieremo un'email quando sarà pronta.\n\nIl pagamento sarà richiesto solo dopo aver approvato l'anteprima.\n\nHai domande? Contattaci: ${SUPPORT_EMAIL}\n\nGrazie per aver scelto WhiteBoar!`
      : `Hello ${businessName}!\n\nWe've received your website creation request.\n\nYour preview will be ready in 5 business days. We'll email you when it's ready for review.\n\nPayment will only be required after you approve the preview.\n\nQuestions? Contact us: ${SUPPORT_EMAIL}\n\nThank you for choosing WhiteBoar!`
  }

  private static generateAdminNotificationText(
    formData: OnboardingFormData,
    submissionId: string
  ): string {
    return `New Onboarding Submission\n\nBusiness: ${formData.businessName}\nEmail: ${formData.businessEmail}\nPhone: ${formData.businessPhone}\nIndustry: ${formData.industry}\nLocation: ${formData.businessCity || 'N/A'}, ${formData.businessProvince || 'N/A'}\n\nOffer: ${formData.businessDescription}\n\nView full submission: ${APP_URL}/admin/submissions/${submissionId}\n\nSubmission ID: ${submissionId}`
  }

  private static generatePreviewEmailHTML(
    businessName: string,
    previewUrl: string,
    locale: 'en' | 'it'
  ): string {
    const content = locale === 'it' ? {
      title: 'La tua anteprima è pronta!',
      message: `Ciao ${businessName}! La tua anteprima personalizzata è pronta per la revisione.`,
      cta: 'Visualizza Anteprima',
      instructions: 'Clicca il pulsante sopra per vedere la tua nuova identità digitale. Se ti piace, potrai procedere con il pagamento per pubblicarla.',
      satisfaction: 'Non soddisfatto? Nessun problema - non paghi nulla.',
    } : {
      title: 'Your preview is ready!',
      message: `Hello ${businessName}! Your custom preview is ready for review.`,
      cta: 'View Preview',
      instructions: 'Click the button above to see your new digital identity. If you love it, you can proceed with payment to publish it.',
      satisfaction: 'Not satisfied? No problem - you don\'t pay anything.',
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${content.title}</title>
        </head>
        <body>
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 40px; text-align: center;">
              <h1>🚀 ${content.title}</h1>
            </div>
            <div style="padding: 40px;">
              <p style="font-size: 18px;">${content.message}</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${previewUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">${content.cta}</a>
              </div>
              <p>${content.instructions}</p>
              <p style="color: #059669;"><strong>${content.satisfaction}</strong></p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private static generatePreviewEmailText(
    businessName: string,
    previewUrl: string,
    locale: 'en' | 'it'
  ): string {
    return locale === 'it'
      ? `Ciao ${businessName}!\n\nLa tua anteprima è pronta: ${previewUrl}\n\nSe ti piace, potrai procedere con il pagamento. Se non sei soddisfatto, non paghi nulla.\n\nGrazie!`
      : `Hello ${businessName}!\n\nYour preview is ready: ${previewUrl}\n\nIf you love it, you can proceed with payment. If not satisfied, you don't pay anything.\n\nThanks!`
  }

  private static generateRecoveryEmailHTML(
    name: string,
    recoveryUrl: string,
    currentStep: number,
    locale: 'en' | 'it'
  ): string {
    const content = locale === 'it' ? {
      title: 'Non perdere la tua creazione',
      message: `Ciao ${name}, hai iniziato a creare il tuo sito web WhiteBoar ma non hai completato il processo.`,
      progress: `Sei arrivato al passo ${currentStep} di 12.`,
      cta: 'Continua la Creazione',
      urgency: 'La tua sessione scadrà presto. Completa ora per non perdere i tuoi progressi.'
    } : {
      title: 'Don\'t lose your creation',
      message: `Hello ${name}, you started creating your WhiteBoar website but haven\'t finished the process.`,
      progress: `You made it to step ${currentStep} of 12.`,
      cta: 'Continue Creating',
      urgency: 'Your session will expire soon. Complete now to avoid losing your progress.'
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${content.title}</title>
        </head>
        <body>
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px; text-align: center;">
              <h1>⏰ ${content.title}</h1>
            </div>
            <div style="padding: 40px;">
              <p>${content.message}</p>
              <p><strong>${content.progress}</strong></p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${recoveryUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">${content.cta}</a>
              </div>
              <p style="color: #dc2626;"><em>${content.urgency}</em></p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private static generateRecoveryEmailText(
    name: string,
    recoveryUrl: string,
    currentStep: number,
    locale: 'en' | 'it'
  ): string {
    return locale === 'it'
      ? `Ciao ${name},\n\nHai iniziato a creare il tuo sito WhiteBoar ma non hai completato il processo. Sei arrivato al passo ${currentStep} di 12.\n\nContinua qui: ${recoveryUrl}\n\nLa tua sessione scadrà presto - completa ora per non perdere i progressi!`
      : `Hello ${name},\n\nYou started creating your WhiteBoar website but haven't finished. You made it to step ${currentStep} of 12.\n\nContinue here: ${recoveryUrl}\n\nYour session will expire soon - complete now to avoid losing progress!`
  }

  // ===========================================================================
  // CUSTOM SOFTWARE INQUIRY EMAILS
  // ===========================================================================

  /**
   * Send payment notification to admin
   */
  static async sendPaymentNotification(
    submissionId: string,
    businessName: string,
    email: string,
    amount: number,
    currency: string,
    stripePaymentId: string,
    additionalLanguages: string[] = []
  ): Promise<boolean> {
    try {
      const subject = `💳 Payment Received: ${businessName} - €${(amount / 100).toFixed(2)}`

      const htmlContent = this.generatePaymentNotificationHTML(
        submissionId,
        businessName,
        email,
        amount,
        currency,
        stripePaymentId,
        additionalLanguages
      )

      const textContent = this.generatePaymentNotificationText(
        submissionId,
        businessName,
        email,
        amount,
        currency,
        stripePaymentId,
        additionalLanguages
      )

      // Skip sending emails in test mode
      if (IS_TEST_MODE) {
        console.log('[TEST MODE] Skipping payment notification email:', {
          to: ADMIN_EMAIL,
          subject,
          submissionId,
          businessName,
          amount
        })
        return true
      }

      const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [ADMIN_EMAIL],
        subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'category', value: 'payment_notification' },
          { name: 'business_name', value: sanitizeTagValue(businessName) },
          { name: 'amount', value: amount.toString() }
        ]
      })

      if (error) {
        console.error('Failed to send payment notification:', error)
        return false
      }

      console.log('Payment notification sent:', data)
      return true
    } catch (error) {
      console.error('Send payment notification error:', error)
      return false
    }
  }

  /**
   * Send custom software inquiry notification to admin
   */
  static async sendCustomSoftwareInquiry(
    formData: CustomSoftwareFormData,
    locale: 'en' | 'it' = 'en'
  ): Promise<boolean> {
    try {
      const subject = locale === 'it'
        ? `Nuova Richiesta Software Personalizzato: ${formData.name}`
        : `New Custom Software Inquiry: ${formData.name}`

      const htmlContent = this.generateCustomSoftwareInquiryHTML(formData, locale)
      const textContent = this.generateCustomSoftwareInquiryText(formData, locale)

      // Skip sending emails in test mode
      if (IS_TEST_MODE) {
        console.log('[TEST MODE] Skipping custom software inquiry email:', {
          to: ADMIN_EMAIL,
          subject,
          customerName: formData.name
        })
        return true
      }

      const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [ADMIN_EMAIL],
        subject,
        html: htmlContent,
        text: textContent,
        tags: [
          { name: 'category', value: 'custom_software_inquiry' },
          { name: 'locale', value: locale }
        ]
      })

      if (error) {
        console.error('Failed to send custom software inquiry:', error)
        return false
      }

      console.log('Custom software inquiry sent:', data)
      return true
    } catch (error) {
      console.error('Send custom software inquiry error:', error)
      return false
    }
  }

  private static generatePaymentNotificationHTML(
    submissionId: string,
    businessName: string,
    email: string,
    amount: number,
    currency: string,
    stripePaymentId: string,
    additionalLanguages: string[]
  ): string {
    const adminUrl = `${APP_URL}/admin/submissions/${submissionId}`
    const stripeUrl = `https://dashboard.stripe.com/payments/${stripePaymentId}`
    const formattedAmount = (amount / 100).toFixed(2)

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Received</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; }
            .content { padding: 30px; }
            .success-badge { background: #d1fae5; color: #065f46; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; margin-bottom: 20px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-item { background: #f8f9fa; padding: 15px; border-radius: 4px; }
            .info-label { font-weight: bold; color: #374151; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
            .info-value { color: #1f2937; font-size: 16px; }
            .amount-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .amount-label { font-size: 14px; opacity: 0.9; margin-bottom: 5px; }
            .amount-value { font-size: 36px; font-weight: bold; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 5px; }
            .button-stripe { background: #635bff; }
            .languages-list { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">💳 Payment Received!</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">A customer has successfully completed payment</p>
            </div>
            <div class="content">
              <div class="success-badge">✓ PAYMENT SUCCESSFUL</div>

              <div class="amount-box">
                <div class="amount-label">Total Amount</div>
                <div class="amount-value">€${formattedAmount}</div>
                <div class="amount-label" style="margin-top: 5px;">${currency}</div>
              </div>

              <h2 style="color: #1f2937; margin-top: 30px;">Customer Details</h2>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Business Name</div>
                  <div class="info-value">${businessName}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value"><a href="mailto:${email}">${email}</a></div>
                </div>
                <div class="info-item">
                  <div class="info-label">Submission ID</div>
                  <div class="info-value" style="font-size: 12px; font-family: monospace;">${submissionId}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Stripe Payment ID</div>
                  <div class="info-value" style="font-size: 12px; font-family: monospace;">${stripePaymentId}</div>
                </div>
              </div>

              ${additionalLanguages.length > 0 ? `
                <div class="languages-list">
                  <strong>📦 Language Add-ons (${additionalLanguages.length}):</strong><br>
                  ${additionalLanguages.map(lang => `• ${lang.toUpperCase()}`).join('<br>')}
                </div>
              ` : ''}

              <h2 style="color: #1f2937; margin-top: 30px;">Next Steps</h2>
              <ol>
                <li>Review the complete submission in the admin panel</li>
                <li>Verify payment in Stripe dashboard</li>
                <li>Begin website creation process</li>
                <li>Schedule preview delivery (5 business days)</li>
              </ol>

              <p style="text-align: center; margin-top: 30px;">
                <a href="${adminUrl}" class="button">View Submission</a>
                <a href="${stripeUrl}" class="button button-stripe">View in Stripe</a>
              </p>
            </div>
            <div class="footer">
              <p>WhiteBoar Admin Panel<br>
              Payment received at ${new Date().toLocaleString('en-US')}</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private static generatePaymentNotificationText(
    submissionId: string,
    businessName: string,
    email: string,
    amount: number,
    currency: string,
    stripePaymentId: string,
    additionalLanguages: string[]
  ): string {
    const formattedAmount = (amount / 100).toFixed(2)
    const adminUrl = `${APP_URL}/admin/submissions/${submissionId}`
    const stripeUrl = `https://dashboard.stripe.com/payments/${stripePaymentId}`

    return `
💳 PAYMENT RECEIVED
${'='.repeat(50)}

✓ PAYMENT SUCCESSFUL

Total Amount: €${formattedAmount} ${currency}

CUSTOMER DETAILS:
Business Name: ${businessName}
Email: ${email}
Submission ID: ${submissionId}
Stripe Payment ID: ${stripePaymentId}

${additionalLanguages.length > 0 ? `
📦 LANGUAGE ADD-ONS (${additionalLanguages.length}):
${additionalLanguages.map(lang => `• ${lang.toUpperCase()}`).join('\n')}
` : ''}

NEXT STEPS:
1. Review the complete submission in the admin panel
2. Verify payment in Stripe dashboard
3. Begin website creation process
4. Schedule preview delivery (5 business days)

View Submission: ${adminUrl}
View in Stripe: ${stripeUrl}

---
WhiteBoar Admin Panel
Payment received at ${new Date().toLocaleString('en-US')}
    `.trim()
  }

  private static generateCustomSoftwareInquiryHTML(
    formData: CustomSoftwareFormData,
    locale: 'en' | 'it'
  ): string {
    const content = locale === 'it' ? {
      title: 'Nuova Richiesta Software Personalizzato',
      intro: 'È stata ricevuta una nuova richiesta per un progetto software personalizzato!',
      contactInfo: 'Informazioni di Contatto',
      projectDetails: 'Dettagli del Progetto',
      nextSteps: 'Prossimi Passi',
      step1: 'Rivedi i dettagli del progetto qui sotto',
      step2: 'Contatta il cliente entro 2 giorni lavorativi',
      step3: 'Pianifica una chiamata di scoperta',
      footer: 'WhiteBoar - Sistema Notifiche'
    } : {
      title: 'New Custom Software Inquiry',
      intro: 'A new custom software project inquiry has been received!',
      contactInfo: 'Contact Information',
      projectDetails: 'Project Details',
      nextSteps: 'Next Steps',
      step1: 'Review the project details below',
      step2: 'Contact the client within 2 business days',
      step3: 'Schedule a discovery call',
      footer: 'WhiteBoar - Notification System'
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${content.title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; }
            .content { padding: 30px; }
            .info-grid { display: grid; grid-template-columns: 1fr; gap: 15px; margin: 20px 0; }
            .info-item { background: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #6366f1; }
            .info-label { font-weight: bold; color: #374151; margin-bottom: 5px; }
            .info-value { color: #1f2937; }
            .description-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .steps { background: #eff6ff; padding: 20px; border-radius: 4px; margin: 20px 0; }
            .steps ol { margin: 10px 0; padding-left: 20px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">🚀 ${content.title}</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">${content.intro}</p>
            </div>
            <div class="content">
              <h2 style="color: #1f2937; margin-top: 0;">${content.contactInfo}</h2>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Name</div>
                  <div class="info-value">${formData.name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value"><a href="mailto:${formData.email}">${formData.email}</a></div>
                </div>
                <div class="info-item">
                  <div class="info-label">Phone</div>
                  <div class="info-value"><a href="tel:${formData.phone}">${formData.phone}</a></div>
                </div>
              </div>

              <h2 style="color: #1f2937; margin-top: 30px;">${content.projectDetails}</h2>
              <div class="description-box">
                <div style="white-space: pre-wrap;">${formData.description}</div>
              </div>

              <div class="steps">
                <h3 style="color: #1f2937; margin-top: 0;">${content.nextSteps}</h3>
                <ol>
                  <li>${content.step1}</li>
                  <li>${content.step2}</li>
                  <li>${content.step3}</li>
                </ol>
              </div>
            </div>
            <div class="footer">
              <p>${content.footer}<br>
              ${new Date().toLocaleString(locale === 'it' ? 'it-IT' : 'en-US')}</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  private static generateCustomSoftwareInquiryText(
    formData: CustomSoftwareFormData,
    locale: 'en' | 'it'
  ): string {
    const content = locale === 'it' ? {
      title: 'Nuova Richiesta Software Personalizzato',
      intro: 'È stata ricevuta una nuova richiesta per un progetto software personalizzato!',
      contact: 'INFORMAZIONI DI CONTATTO',
      project: 'DETTAGLI DEL PROGETTO',
      nextSteps: 'PROSSIMI PASSI',
      step1: '1. Rivedi i dettagli del progetto',
      step2: '2. Contatta il cliente entro 2 giorni lavorativi',
      step3: '3. Pianifica una chiamata di scoperta'
    } : {
      title: 'New Custom Software Inquiry',
      intro: 'A new custom software project inquiry has been received!',
      contact: 'CONTACT INFORMATION',
      project: 'PROJECT DETAILS',
      nextSteps: 'NEXT STEPS',
      step1: '1. Review the project details',
      step2: '2. Contact the client within 2 business days',
      step3: '3. Schedule a discovery call'
    }

    return `
${content.title}
${'='.repeat(50)}

${content.intro}

${content.contact}:
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}

${content.project}:
${formData.description}

${content.nextSteps}:
${content.step1}
${content.step2}
${content.step3}

---
WhiteBoar - Notification System
${new Date().toLocaleString(locale === 'it' ? 'it-IT' : 'en-US')}
    `.trim()
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Send verification email (convenience wrapper)
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  code: string,
  locale: 'en' | 'it' = 'en'
): Promise<boolean> {
  const result = await EmailService.sendVerificationEmail(email, name, code, locale)
  return result.success && result.data?.sent === true
}

/**
 * Send all completion notifications (user + admin)
 */
export async function sendCompletionNotifications(
  formData: OnboardingFormData,
  submissionId: string,
  locale: 'en' | 'it' = 'en'
): Promise<{ userNotified: boolean; adminNotified: boolean }> {
  const [userResult, adminResult] = await Promise.all([
    EmailService.sendCompletionConfirmation(formData.email, formData.businessName, locale),
    EmailService.sendAdminNotification(formData, submissionId)
  ])

  return {
    userNotified: userResult,
    adminNotified: adminResult
  }
}

/**
 * Check if Resend service is properly configured
 */
export function isEmailServiceConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY || process.env.RESEND_KEY) && !!FROM_EMAIL
}

// EmailService is already exported as a class above
