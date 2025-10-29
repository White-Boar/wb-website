/**
 * UI Amount Parser
 * Extracts amount from UI text to validate against Stripe
 */

import { Page } from '@playwright/test'

/**
 * Parses amount from UI text
 * @example parseAmountFromUI("Pay €35.00") → 3500 (cents)
 * @example parseAmountFromUI("€28.00") → 2800 (cents)
 */
export function parseAmountFromUI(text: string): number {
  const match = text.match(/€\s*(\d+(?:\.\d{2})?)/)
  if (!match) {
    throw new Error(`Could not parse amount from: ${text}`)
  }
  return Math.round(parseFloat(match[1]) * 100)
}

/**
 * Gets the payment amount from the Pay button
 */
export async function getUIPaymentAmount(page: Page): Promise<number> {
  // Wait for the Pay button to have a non-zero price (prices load from API)
  const payButton = page.locator('button:has-text("Pay €")')
  await payButton.waitFor({ state: 'visible', timeout: 30000 })

  // Wait a bit for prices to load from API
  await page.waitForTimeout(2000)

  const buttonText = await payButton.textContent()
  if (!buttonText) {
    throw new Error('Pay button text not found')
  }
  const amount = parseAmountFromUI(buttonText)

  // If amount is 0, prices haven't loaded yet - wait and retry
  if (amount === 0) {
    await page.waitForTimeout(3000)
    const retryText = await payButton.textContent()
    if (!retryText) {
      throw new Error('Pay button text not found on retry')
    }
    return parseAmountFromUI(retryText)
  }

  return amount
}

/**
 * Gets the recurring monthly amount from the UI
 * Looks for commitment text like "12 monthly payments of €35" or "12 monthly payments of €28"
 */
export async function getUIRecurringAmount(page: Page): Promise<number> {
  const commitmentLocator = page.locator('text=/12 monthly payments of €/i')
  await commitmentLocator.waitFor({ state: 'visible', timeout: 30000 })
  await page.waitForTimeout(1000) // Let prices load

  const commitmentText = await commitmentLocator.textContent()
  if (!commitmentText) {
    throw new Error('Commitment notice text not found')
  }
  return parseAmountFromUI(commitmentText)
}

/**
 * Fills Stripe payment form with test card
 */
export async function fillStripePaymentForm(page: Page) {
  // Wait for Stripe Elements iframe to load
  await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
  await page.waitForTimeout(3000) // Let Stripe fully initialize

  // Get the Stripe iframe locator
  const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()

  // Wait for the card input fields to be visible
  await stripeFrame.getByRole('textbox', { name: 'Card number' }).waitFor({
    state: 'visible',
    timeout: 30000
  })

  // Fill card number (Stripe test card)
  await stripeFrame.getByRole('textbox', { name: 'Card number' }).fill('4242424242424242')
  await page.waitForTimeout(500)

  // Fill expiry date
  await stripeFrame.getByRole('textbox', { name: /Expiration date/i }).fill('1228')
  await page.waitForTimeout(500)

  // Fill CVC
  await stripeFrame.getByRole('textbox', { name: 'Security code' }).fill('123')
  await page.waitForTimeout(500)
}
