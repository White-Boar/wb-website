/**
 * Stripe Validation Utilities
 * Validates that Stripe objects match expected payment state
 */

import Stripe from 'stripe'
import { expect } from '@playwright/test'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover'
})

export interface ExpectedPaymentState {
  totalAmount: number
  hasDiscount: boolean
  discountCode?: string
  discountPercent?: number
  recurringAmount: number
}

/**
 * Validates that Stripe objects match expected payment state
 * This is the CRITICAL validation missing from current tests
 */
export async function validateStripePaymentComplete(
  submission: any,
  expected: ExpectedPaymentState
) {
  // 1. VALIDATE PAYMENT INTENT
  const paymentIntent = await stripe.paymentIntents.retrieve(
    submission.stripe_payment_id
  )
  expect(paymentIntent.status).toBe('succeeded')
  expect(paymentIntent.amount).toBe(expected.totalAmount)
  expect(paymentIntent.currency).toBe('eur')

  // 2. VALIDATE SUBSCRIPTION HAS DISCOUNT (or not)
  console.log('[StripeValidation] checking subscription', submission.stripe_subscription_id)
  let subscription = await stripe.subscriptions.retrieve(
    submission.stripe_subscription_id,
    { expand: ['discounts'] }
  )

  if (expected.hasDiscount) {
    if (!subscription.discount) {
      const discountFromList = Array.isArray(subscription.discounts) && subscription.discounts.length > 0
        ? subscription.discounts[0]
        : null
      if (discountFromList) {
        const couponId = (discountFromList as any).source?.coupon || (discountFromList as any).coupon
        expect(couponId).toBe(expected.discountCode)
        if (expected.discountPercent) {
          const coupon =
            typeof couponId === 'string'
              ? await stripe.coupons.retrieve(couponId)
              : couponId
          expect(coupon.percent_off).toBe(expected.discountPercent)
        }
        subscription.discount = discountFromList as any
      }
    }
    if (!subscription.discount) {
      for (let attempt = 0; attempt < 4 && !subscription.discount; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        subscription = await stripe.subscriptions.retrieve(
          submission.stripe_subscription_id,
          { expand: ['discounts'] }
        )
        if (!subscription.discount) {
          const discountFromList = Array.isArray(subscription.discounts) && subscription.discounts.length > 0
            ? subscription.discounts[0]
            : null
          if (discountFromList) {
            const couponId = (discountFromList as any).source?.coupon || (discountFromList as any).coupon
            expect(couponId).toBe(expected.discountCode)
            if (expected.discountPercent) {
              const coupon =
                typeof couponId === 'string'
                  ? await stripe.coupons.retrieve(couponId)
                  : couponId
              expect(coupon.percent_off).toBe(expected.discountPercent)
            }
            subscription.discount = discountFromList as any
          }
        }
      }
    }
    console.log('[StripeValidation] subscription.discount', subscription.discount)
    expect(subscription.discount).toBeTruthy()
    const discountCoupon = (subscription.discount as any).coupon || (subscription.discount as any).source?.coupon
    if (typeof discountCoupon === 'string') {
      expect(discountCoupon).toBe(expected.discountCode)
      if (expected.discountPercent) {
        const coupon = await stripe.coupons.retrieve(discountCoupon)
        expect(coupon.percent_off).toBe(expected.discountPercent)
      }
    } else {
      expect(discountCoupon.id).toBe(expected.discountCode)
      if (expected.discountPercent) {
        expect(discountCoupon.percent_off).toBe(expected.discountPercent)
      }
    }
  } else {
    expect(subscription.discount).toBeFalsy()
  }

  // 3. VALIDATE SUBSCRIPTION SCHEDULE HAS DISCOUNT IN PHASE
  console.log('[StripeValidation] checking schedule', submission.stripe_subscription_schedule_id)
  let schedule = await stripe.subscriptionSchedules.retrieve(
    submission.stripe_subscription_schedule_id
  )

  expect(schedule.status).toBe('active')
  expect(schedule.phases.length).toBe(1)

  if (expected.hasDiscount) {
    if (!schedule.phases[0].discounts || schedule.phases[0].discounts!.length === 0) {
      for (let attempt = 0; attempt < 4 && (!schedule.phases[0].discounts || schedule.phases[0].discounts!.length === 0); attempt++) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        schedule = await stripe.subscriptionSchedules.retrieve(
          submission.stripe_subscription_schedule_id
        )
      }
    }
    console.log('[StripeValidation] schedule discounts', schedule.phases[0].discounts)
    expect(schedule.phases[0].discounts).toHaveLength(1)
    expect(schedule.phases[0].discounts![0].coupon).toBe(expected.discountCode)
  } else {
    expect(schedule.phases[0].discounts || []).toHaveLength(0)
  }

  // 4. VALIDATE FUTURE INVOICES WILL CHARGE CORRECT AMOUNT
  const upcomingInvoice = await stripe.invoices.createPreview({
    customer: submission.stripe_customer_id,
    subscription: submission.stripe_subscription_id
  })

  expect(upcomingInvoice.total).toBe(expected.recurringAmount)

  // 5. VALIDATE INVOICE BREAKDOWN (if first payment completed)
  let invoice
  if (submission.payment_metadata?.invoice_id) {
    invoice = await stripe.invoices.retrieve(
      submission.payment_metadata.invoice_id
    )

    expect(invoice.status).toBe('paid')
    expect(invoice.amount_paid).toBe(expected.totalAmount)
  }

  return { invoice, subscription, schedule, paymentIntent }
}

export interface ExpectedInvoiceBreakdown {
  recurringAmount: number // After discount
  oneTimeAmount: number   // NO discount
  totalAmount: number
  discountCode: string
}

/**
 * Validates discount is applied correctly to recurring vs one-time items
 */
export async function validateInvoiceDiscountBreakdown(
  invoiceId: string,
  expected: ExpectedInvoiceBreakdown
) {
  const invoice = await stripe.invoices.retrieve(invoiceId, {
    expand: ['lines.data']
  })

  // Find subscription line item (recurring)
  const subLine = invoice.lines.data.find(line => line.subscription_item)
  expect(subLine).toBeTruthy()
  expect(subLine!.amount).toBe(expected.recurringAmount)

  // Verify discount applied to subscription line
  if (subLine!.discount_amounts) {
    expect(subLine!.discount_amounts.length).toBeGreaterThan(0)
  }

  // Find invoice items (one-time, e.g., language add-ons)
  const oneTimeLines = invoice.lines.data.filter(line => !line.subscription_item)

  if (expected.oneTimeAmount > 0) {
    expect(oneTimeLines.length).toBeGreaterThan(0)

    // One-time items should NOT have discount
    oneTimeLines.forEach(line => {
      if (line.discount_amounts) {
        expect(line.discount_amounts.length).toBe(0)
      }
    })
  }

  // Validate total
  expect(invoice.total).toBe(expected.totalAmount)
  expect(invoice.amount_paid).toBe(expected.totalAmount)
}
