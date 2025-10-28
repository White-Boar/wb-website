## WB Testing procedure
**Always follow this testing procedure**

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