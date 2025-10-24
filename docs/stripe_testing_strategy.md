# Automated Stripe Testing Strategy for WhiteBoar Onboarding

This document defines a fully automated strategy to test Stripe integration in WhiteBoar's onboarding flow using **Playwright** and **Jest**. All tests are run in test mode across development, CI, and production-safe setups.

---

## ✅ Overview
- **Frameworks:** Next.js + Stripe Elements + Vercel
- **Tools:** Playwright (E2E), Jest (unit/integration), Stripe CLI
- **Stripe Features:** One-time payments, subscriptions, webhooks
- **Environment Separation:** Test mode only in CI/dev; no live keys touched
- **Manual Testing:** None — all flows fully automated

---

## 🧪 E2E Testing with Playwright

### 🎯 Stripe Elements Automation
```ts
await page.frameLocator('[title="Secure card number input frame"]')
  .locator('input[name="cardnumber"]').fill('4242424242424242');
await page.frameLocator('[title="Secure expiration date input frame"]')
  .locator('input[name="exp-date"]').fill('01/28');
await page.frameLocator('[title="Secure CVC input frame"]')
  .locator('input[name="cvc"]').fill('123');
```

### ✅ Success Scenarios
- Use `4242 4242 4242 4242` card
- Assert successful onboarding state (confirmation screen, account flag, etc.)

### ❌ Failure Scenarios
- Use decline cards (e.g., `4000 0000 0000 0002` for generic decline)
- Assert proper error messaging, retry options, etc.

---

## 🔁 Subscription Workflow Testing

1. Trigger subscription signup via UI
2. Use Stripe CLI or local script to simulate webhook:
```bash
stripe trigger invoice.payment_succeeded
```
3. Assert user account upgraded/activated

---

## 📬 Webhook Testing

### CLI-Based
```bash
stripe trigger checkout.session.completed
```

### Jest-Based
```ts
const payload = JSON.stringify({ id: 'evt_test', object: 'event' });
const signature = stripe.webhooks.generateTestHeaderString({
  payload,
  secret: process.env.STRIPE_WEBHOOK_SECRET
});
await request(app)
  .post('/api/webhook')
  .set('Stripe-Signature', signature)
  .send(payload)
  .expect(200);
```

---

## ⚙️ GitHub Actions Workflow

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    env:
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_TEST_PUBLISHABLE_KEY }}
      STRIPE_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
      STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test
      - run: npx playwright test
```

---

## 🔐 Security & Best Practices
- Use `stripe.webhooks.constructEvent` for all webhook verification
- Never use live keys or real payments in test automation
- Rotate webhook secrets periodically
- Ensure all webhook endpoints use HTTPS

---

## 🧼 Cleanup & Maintenance
- No cleanup needed for test-mode Stripe objects
- Use rate-limiting headers and retries if testing at scale
- Store Playwright traces in CI for flaky test debugging

---

## ✅ Summary
| Layer         | Tool        | Notes                             |
|--------------|-------------|-----------------------------------|
| E2E UI       | Playwright  | Fills Stripe iframes, submits UI  |
| Webhooks     | Jest/CLI    | Signed mock POST or trigger CLI   |
| Unit Tests   | Jest        | Stripe SDK mocked where needed    |
| CI Pipeline  | GitHub      | Fully automated via Actions       |

This strategy guarantees confidence in payment flows with no manual interaction.
