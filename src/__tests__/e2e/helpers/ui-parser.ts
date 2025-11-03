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

  await page.waitForFunction(() => {
    const preview = (window as any).__wb_lastDiscountPreview
    if (!preview) {
      return false
    }
    const button = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent && btn.textContent.includes('Pay €')
    ) as HTMLButtonElement | undefined
    if (!button) return false
    const text = button.textContent || ''
    const match = text.match(/€\s*(\d+(?:\.\d{2})?)/)
    if (!match) return false
    const amount = Math.round(parseFloat(match[1]) * 100)
    return amount === preview.total
  }, { timeout: 20000 })

  const buttonText = await payButton.textContent()
  if (!buttonText) {
    throw new Error('Pay button text not found')
  }
  return parseAmountFromUI(buttonText)
}

/**
 * Gets the recurring monthly amount from the UI
 * Looks for commitment text like "12 monthly payments of €35" or "12 monthly payments of €28"
*/
export async function getUIRecurringAmount(page: Page): Promise<number> {
  const commitmentLocator = page.locator('text=/12 monthly payments of €/i')
  await commitmentLocator.waitFor({ state: 'visible', timeout: 30000 })
  await page.waitForFunction(() => {
    const preview = (window as any).__wb_lastDiscountPreview
    if (!preview) {
      return false
    }
    const el = Array.from(document.querySelectorAll('body *')).find(node => node.textContent?.match(/12 monthly payments of €\d+/i))
    if (!el) return false
    const match = el.textContent?.match(/€\s*(\d+(?:\.\d{2})?)/)
    if (!match) return false
    const amount = Math.round(parseFloat(match[1]) * 100)
    return amount === preview.recurringAmount
  }, { timeout: 20000 })

  const commitmentText = await commitmentLocator.textContent()
  if (!commitmentText) {
    throw new Error('Commitment notice text not found')
  }
  return parseAmountFromUI(commitmentText)
}

/**
 * Fills Stripe payment form with test card
 */
export async function fillStripePaymentForm(
  page: Page,
  options: { cardNumber?: string; expiry?: string; cvc?: string } = {}
) {
  const {
    cardNumber = '4242424242424242',
    expiry = '1228',
    cvc = '123'
  } = options

  // Wait for Stripe Elements iframe to load
  await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 30000 })
  await page.waitForTimeout(3000) // Let Stripe fully initialize

  // Get the Stripe iframe locator
  const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first()

  // Ensure card tab is active
  const cardTab = stripeFrame.getByRole('tab', { name: /card/i })
  await cardTab.waitFor({ state: 'visible', timeout: 10000 })
  const isCardSelected = await cardTab.getAttribute('aria-selected')
  if (isCardSelected !== 'true') {
    await cardTab.click({ force: true })
    await page.waitForTimeout(200)
  }

  // Wait for the card input fields to be visible
  await stripeFrame.getByRole('textbox', { name: 'Card number' }).waitFor({
    state: 'visible',
    timeout: 30000
  })

  // Fill card number (Stripe test card)
  const cardNumberInput = stripeFrame.getByRole('textbox', { name: 'Card number' })
  await cardNumberInput.click()
  await cardNumberInput.pressSequentially(cardNumber, { delay: 20 })
  await page.waitForTimeout(250)

  // Fill expiry date
  const expiryInput = stripeFrame.getByRole('textbox', { name: /Expiration date/i })
  await expiryInput.click()
  await expiryInput.pressSequentially(expiry, { delay: 20 })
  await page.waitForTimeout(250)

  // Fill CVC
  const cvcInput = stripeFrame.getByRole('textbox', { name: 'Security code' })
  await cvcInput.click()
  await cvcInput.pressSequentially(cvc, { delay: 20 })
  await page.waitForTimeout(250)

  // Optional billing details (fill when present)
  const countrySelect = stripeFrame.getByRole('combobox', { name: /country/i })
  if (await countrySelect.count()) {
    try {
      await countrySelect.selectOption({ label: 'Italy' })
    } catch {
      // ignore if already selected
    }
  }

  const addressLine1 = stripeFrame.getByRole('textbox', { name: /address line 1/i })
  if (await addressLine1.count()) {
    await addressLine1.click()
    await addressLine1.pressSequentially('Via Roma 1', { delay: 15 })
    await page.waitForTimeout(150)
  }

  const postalCodeInput = stripeFrame.getByRole('textbox', { name: /postal code/i })
  if (await postalCodeInput.count()) {
    await postalCodeInput.click()
    await postalCodeInput.pressSequentially('20100', { delay: 15 })
    await page.waitForTimeout(150)
  }

  const cityInput = stripeFrame.getByRole('textbox', { name: /city/i })
  if (await cityInput.count()) {
    await cityInput.click()
    await cityInput.pressSequentially('Milano', { delay: 15 })
    await page.waitForTimeout(150)
  }

  const provinceInput = stripeFrame.getByRole('textbox', { name: /province/i })
  if (await provinceInput.count()) {
    await provinceInput.click()
    await provinceInput.pressSequentially('MI', { delay: 15 })
    await page.waitForTimeout(150)
  }
}
