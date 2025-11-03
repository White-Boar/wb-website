## WB Testing procedure
**Always follow this testing procedure**

### Test environment setup

- E2E tests now spin up a production Next.js build automatically. You can pre-start it manually if you prefer: `pnpm build && PORT=3783 pnpm start -- --hostname localhost`.
- Make sure a Stripe CLI listener is running (the global Playwright setup starts one when needed). You can launch it yourself with:
  ```bash
  stripe listen --events 'payment_intent.*,invoice.*,customer.*,subscription.*' \
    --forward-to http://localhost:3783/api/stripe/webhook \
    --request-timeout 120
  ```

### Test execution

1. Run the test suit as instructed:
    - For unit tests run `pnpm test:unit`
    - For unit integration run `pnpm test:integration`
    - For e2e tests run `pnpm test:e2e --project=chromium --reporter=line`. Never use `--headed`
2.  Once you identify the failing tests, use Playwrite MCP to validate if its a testing or an implementation issue, and the best way to fix it. 
3. Be patient and take your time. 
4. Once a fix has been implemented, run only the sepcific text to validate that the fix worked. If it did not repeat steps 2 to 4. 
5. Run the whole test suit and continue.
6. Don't stop until all test pass.



## Running Playwrite MCP
1. Seed the session
2. Inject local storage BEGORE navigation
