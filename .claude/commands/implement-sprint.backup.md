---
description: Execute the implementation plan by processing and executing all tasks defined in the current sprint
---

The user input can be provided directly by the agent or as a command argument - you **MUST** consider it before proceeding with the prompt (if not empty).

User input:

$ARGUMENTS

## Configuration
**Test Performance Thresholds**:
- Individual test: < 1 minute (hard limit - optimize if exceeded)
- Unit test suite: < 20 seconds total
- Integration test suite: < 30 seconds total
- E2E test suite: < 3 minutes total
- Full test suite: < 5 minutes total

## Execution Accountability

For EVERY task completed, the agent MUST produce these artifacts:

**Required Artifacts Per Task**:
1. Test file path (e.g., `__tests__/components/Welcome.test.tsx`)
2. Test output showing PASS status
3. Implementation file path(s)
4. Build success confirmation
5. Backlog.md with task marked [Done]

**For UI Tasks, Also Required**:
6. Visual validation confirmation that ui complies with design system and matches any design files / mockups. 
7. Screenshot path (mobile view)
8. Screenshot path (desktop view)

**Sprint Completion Artifacts**:
9. Full test suite output (unit + e2e)
10. Production build success output
11. Git commit hash

**Verification Method**:
- Agent reports artifact paths after each task
- User can verify files exist at reported paths
- No task is "complete" without these artifacts

## Implementation

1. Run `.specify/scripts/bash/check-prerequisites.sh --json` from repo root and parse FEATURE_DIR. All paths must be absolute.

2. Validate prerequisites and load sprint:
   - Check for sprint files in FEATURE_DIR (sprint-*.md)
   - If sprint number not provided: Find most recent sprint file
   - If no sprint files found: ERROR "No sprint found. Run /plan-sprint first"
   - Load selected sprint file (sprint-XXX.md)

3. Load and analyze sprint context:
   - Parse sprint goal and elaboration
   - Extract tasks with IDs, priorities, estimates, acceptance criteria
   - Note dependencies between tasks
   - Load related documentation:
     * **REQUIRED**: Read FEATURE_DIR/spec.md for requirements
     * **REQUIRED**: Read FEATURE_DIR/backlog.md for tasks
     * **REQUIRED**: Read FEATURE_DIR/plan.md for architecture
     * **IF EXISTS**: Read FEATURE_DIR/data-model.md for entities
     * **IF EXISTS**: Read FEATURE_DIR/contracts/ for API specs
   - Use context to understand implementation requirements

4. Execute tasks in **priority order**:
   - Execute task in the order listed
   - Respect task dependencies

5. Execute each task in priority order following TDD:

   a) **Start task**:
      ```
      Starting Task [ID]: [Description]
      Priority: [P0/P1/P2] | Estimate: [X hours]
      ```

   b) **Create test file**:
      - Based on task type, create test file:
        * UI Component → __tests__/components/[name].test.tsx
        * API Route → __tests__/api/[name].test.ts
        * Utility → __tests__/lib/[name].test.ts
      - Write test matching acceptance criteria
      - Run test command to verify it fails

      **CHECKPOINT**: Test MUST show "FAIL" or "0 passing"
      → If test passes without implementation: HALT "Test insufficient - add assertions that fail without implementation"

      Report: "✅ Test created and failing: [filepath]"

   c) **Implement code**:
      - Write minimal code to make test pass
      - Focus on acceptance criteria requirements
      - Don't over-engineer beyond task scope
      - Run test again

      **CHECKPOINT**: Test MUST now show "PASS"
      → If test fails after 5 attempts: HALT "Tests failing after 5 attempts" and ask user for guidance

      Report: "✅ Implementation complete: [filepath]"

   d) **Validate acceptance criteria**:
      - Load acceptance criteria from sprint file for this task
      - For each criterion:
        * Read criterion text
        * Verify criterion is met (check files, test output, behavior)
        * Collect evidence (file paths, test output, screenshots)

      **CHECKPOINT**: All criteria MUST be met
      → If any criterion not met after 5 attempts: HALT "Acceptance criteria not met: [list failed criteria]" and ask user for guidance

      Report: "✅ Acceptance criteria validated: [count]/[total]"

   e) **Visual validation** (for UI tasks only):
      - Check if acceptance criteria mentions "Visual design matches"
      - If yes:
        * Start dev server: `PORT=3783 pnpm dev` (run in background)
        * Use Playwright MCP to navigate to the route
        * Take screenshot (desktop): screenshots/sprint-[N]-task-[ID]-desktop.png
        * Check responsive (mobile 375x667): screenshots/sprint-[N]-task-[ID]-mobile.png
        * Validate agains design system and if avaiable, visual desing file using Playwrite MCP.
        * Check dark theme if applicable

      **CHECKPOINT**: Screenshots MUST be saved
      → If visual issues found: Fix styling and re-validate

      Report: "✅ Visual validation complete: [screenshot paths]"

      - If no visual validation needed: Skip and report "⊘ No visual validation required"

   f) **Update backlog immediately**:
      - Open FEATURE_DIR/backlog.md
      - Find line containing "**T[ID]**"
      - Change status from [WIP] to [Done]
      - Add completion comment: "→ Sprint [N] - Completed [YYYY-MM-DD]"
      - Write file back to disk
      - Read file again to verify change

      **CHECKPOINT**: File MUST contain updated status
      → If update failed: HALT "Failed to update backlog.md for task [ID]"

      Report: "✅ Backlog updated: Task [ID] marked [Done]"

   g) **Run build**:
      - Execute project build command: `pnpm next build`

      **CHECKPOINT**: Build MUST succeed without errors
      → If build fails: Fix issues (max 5 attempts)
      → If still failing after 5 attempts: HALT "Build broken after 5 fix attempts" and ask user for guidance

      Report: "✅ Build successful"

6. Sprint validation (MANDATORY - cannot skip):

   a) **Run full test suite**:
      1. Execute unit tests:
         - Command: `pnpm test`
         - Capture: pass_count, fail_count, duration

      2. Execute E2E tests:
         - Command: `pnpm test:e2e` OR `pnpm exec playwright test`
         - Capture: pass_count, fail_count, duration

      3. **CHECKPOINT**: All tests MUST pass
         → If ANY test fails: HALT "Cannot complete sprint with failing tests. Fix or remove failing tests."

      4. Count new test files created:
         - Command: `git diff --cached --name-only | grep -E '\.test\.(ts|tsx)$' | wc -l`
         - Store as: new_test_count

      5. Report test summary:
         ```
         Test Results:
         - Unit tests: [X] passed in [Y]s
         - E2E tests: [X] passed in [Y]s
         - New test files created this sprint: [new_test_count]
         ```

   b) **Run build process**:
      - Execute: `pnpm next build`

      **CHECKPOINT**: Build MUST succeed
      → If fails: HALT "Production build broken - fix before committing"

      Report: "✅ Production build successful"

   c) **Verify sprint goal**:
      - Read sprint goal from sprint-[N].md
      - Count P0 tasks in sprint file
      - Count completed tasks: `grep -c "→ Sprint [N] - Completed" FEATURE_DIR/backlog.md`

      **CHECKPOINT**: All P0 tasks MUST be [Done]
      → If any P0 task still [WIP]: HALT "Sprint incomplete - [X] P0 tasks remaining: [list task IDs]"

      Report: "✅ Sprint goal achieved: All P0 tasks complete"

7. Verify backlog consistency:

   a) Count tasks in sprint file:
      - Open sprint-[N].md
      - Count tasks listed in "Selected Tasks" section
      - Store as: sprint_task_count

   b) Count completed tasks in backlog:
      - Command: `grep -c "→ Sprint [N] - Completed" FEATURE_DIR/backlog.md`
      - Store as: completed_task_count

   c) **CHECKPOINT**: Counts MUST match
      → If mismatch: HALT "Backlog inconsistent. Sprint file has [X] tasks but backlog shows [Y] completed."

   Report: "✅ Backlog verified: [completed_task_count] tasks marked [Done]"

   NOTE: Backlog updates happen in step 5f immediately after each task completes.
         This step only VERIFIES all updates happened correctly.

7.5. Pre-commit artifact verification:

   a) Count test files being committed:
      - Command: `git diff --cached --name-only | grep -E '\.test\.(ts|tsx)$' | wc -l`
      - Store as: new_test_count

   b) Count tasks completed:
      - Use: completed_task_count from step 7

   c) **CHECKPOINT**: Verify test coverage
      → If new_test_count < completed_task_count:
        WARN "Only [new_test_count] tests for [completed_task_count] tasks"
        WARN "Expected at least 1 test per task (TDD requirement)"
        Ask user: "Proceed with commit despite missing tests? (y/n)"
        → If user says no: HALT execution

   d) List all staged files:
      - Command: `git diff --cached --name-status`
      - Display full list to user

   e) Ask for final confirmation:
      Display:
      ```
      Ready to commit:
      - [X] files changed
      - [Y] new test files
      - [Z] tasks completed

      Proceed with commit? (y/n)
      ```
      → If user says no: HALT execution

   Report: "✅ Pre-commit verification complete"

8. Git commit (only after all checkpoints passed):
   - Stage all changes: `git add .`
   - Create commit message:
     ```
     feat: Complete Sprint [XXX] - [Sprint Goal Summary]

     Completed tasks:
     - [Task ID]: [Brief description]
     - [Task ID]: [Brief description]

     All tests passing, build successful.
     Sprint goal achieved: [Goal elaboration]
     ```
   - Execute commit
   - If commit fails: report error

9. Deployment prompt:
   - Ask user: "Sprint completed successfully. Deploy to production? (y/n)"
   - If yes:
     * Determine deployment command from project setup
     * Common options: `pnpm deploy`, `npm run deploy`, `git push origin main`
     * Execute deployment
     * Report deployment status
   - If no:
     * Report: "Sprint completed. Code committed but not deployed."

10. Final report:
    - Sprint number and goal
    - Tasks completed: X of Y
    - Tests created: X files
    - Test performance metrics
    - Commit hash
    - Deployment status
    - Any warnings or issues encountered

## Error Handling

- **Fix-first approach**: Always attempt to fix issues automatically
- **Max 5 attempts**: Stop after 5 failed fix attempts
- **Clear reporting**: Provide context about what was tried
- **Manual fallback**: Ask for user guidance when auto-fix fails

## Test Optimization Strategies

When tests exceed time limits:
1. **Reduce waits**: Replace fixed delays with condition checks
2. **Mock externals**: Mock API calls, database queries
3. **Use fixtures**: Pre-create test data instead of generating
4. **Parallelize**: Run independent tests concurrently
5. **Skip redundant**: Avoid duplicate setup/teardown
6. **Focus scope**: Test only what's needed for the task

## Success Criteria

Sprint implementation succeeds when:
- All tasks completed with [Done] status in backlog.md
- All tests passing (unit + e2e)
- All test files created (min 1 per task for TDD compliance)
- Visual validation matches design system and deisgn files
- No test exceeds 1 minute
- Build succeeds (development and production)
- Sprint goal achieved (all P0 tasks complete)
- Backlog consistency verified
- Code committed successfully with all artifacts

Context for sprint implementation: $ARGUMENTS
