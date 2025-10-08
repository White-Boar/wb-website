import { Resend } from 'resend'
import { CustomSoftwareFormData } from '@/types/custom-software'

// =============================================================================
// RESEND EMAIL SERVICE CONFIGURATION
// =============================================================================

const resend = new Resend(process.env.RESEND_API_KEY || process.env.RESEND_KEY)

// Email configuration from environment
const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || (process.env.NODE_ENV === 'development' ? 'onboarding@resend.dev' : 'noreply@notifications.whiteboar.it')
const FROM_NAME = process.env.FROM_NAME || 'WhiteBoar'
const ADMIN_EMAIL = process.env.NOTIFICATION_ADMIN_EMAIL || 'admin@whiteboar.it'

// Validate Resend API key
if (!process.env.RESEND_API_KEY && !process.env.RESEND_KEY) {
  console.error('WARNING: RESEND_API_KEY or RESEND_KEY environment variable is not set')
}

// =============================================================================
// EMAIL SERVICE CLASS
// =============================================================================

export class EmailService {

  // ===========================================================================
  // CUSTOM SOFTWARE INQUIRY EMAILS
  // ===========================================================================

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
 * Check if Resend service is properly configured
 */
export function isEmailServiceConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY || process.env.RESEND_KEY) && !!FROM_EMAIL
}
