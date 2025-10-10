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

5. For each task, follow strict TDD process:

   a) **Announce task start**:
      ```
      Starting Task [ID]: [Description]
      Priority: [P0/P1/P2] | Estimate: [X hours]
      ```

   b) **Write tests first (Red phase)**:
      - Based on task type and acceptance criteria, write appropriate tests:
        * Unit tests for components/functions
        * Integration tests for API endpoints
        * E2E tests for user workflows
      - Tests MUST fail initially (verify Red phase)
      - If tests pass without implementation: ERROR "Tests insufficient - add more specific tests"

   c) **Implement code (Green phase)**:
      - Write minimal code to make tests pass
      - Focus on acceptance criteria requirements
      - Don't over-engineer beyond task scope

   d) **Test and fix loop** (max 3 attempts):
      - Run relevant tests
      - Measure execution time of each test
      - If any single test takes >1 minute:
        * Optimize immediately (reduce waits, mock externals, use fixtures)
        * Re-run to verify optimization
      - If tests fail:
        * Attempt 1: Analyze error, fix implementation
        * Attempt 2: Debug deeper, check edge cases
        * Attempt 3: Review requirements, fix logic
      - If still failing after 3 attempts:
        * WARN "Tests failing after 3 attempts"
        * Report specific failures
        * Ask user for guidance

   e) **Validate acceptance criteria** (max 3 attempts):
      - For each criterion in sprint file:
        * Check if criterion is met
        * If not met: implement missing functionality
        * Re-test to verify
      - If criteria not met after 3 attempts:
        * WARN "Acceptance criteria not met"
        * Report which criteria failed
        * Ask user for guidance

   f) **Visual validation** (for UI tasks):
      - If task involves UI changes:
        * Validate according to project visual standards
        * Check responsive behavior (mobile/desktop)
        * Verify theme compliance (light/dark if applicable)
        * Inspect UI visually and verify
      - If visual issues found:
        * Attempt to fix styling/layout
        * Re-validate

   g) **Run build process**:
      - Execute project build command
      - Build MUST succeed without errors
      - If build fails:
        * Fix issues (max 3 attempts)
        * If still failing: report and ask for guidance        

   h) **Update task status**:
      - Mark task as completed in memory
      - Will update files after all tasks complete

6. Sprint completion validation:

   a) **Run full test suite**:
      - Execute project test command
      - Measure total execution time
      - If exceeds 5 minutes:
        * Identify slowest tests
        * Optimize them (focus on tests >1 minute)
        * Re-run suite
      - All tests MUST pass

   b) **Run build process**:
      - Execute project build command
      - Build MUST succeed without errors
      - If build fails:
        * Fix issues (max 3 attempts)
        * If still failing: report and ask for guidance

   c) **Verify sprint goal**:
      - Review sprint goal from sprint file
      - Confirm all P0 tasks completed
      - Verify client value is deliverable
      - If goal not achieved:
        * Report what's missing
        * Ask user to confirm if acceptable

7. Update status in files:
   - In sprint file: Mark all completed tasks
   - In FEATURE_DIR/backlog.md:
     * Change all sprint tasks from [WIP] to [Done]
     * Add completion date comment
   - Write both files back to disk

8. Git commit (if all validations pass):
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
    - Test performance metrics
    - Commit hash
    - Deployment status
    - Any warnings or issues encountered

## Error Handling

- **Fix-first approach**: Always attempt to fix issues automatically
- **Max 3 attempts**: Stop after 3 failed fix attempts
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
- All tasks completed
- All tests passing
- No test exceeds 1 minute
- Build succeeds
- Sprint goal achieved
- Code committed successfully

Context for sprint implementation: $ARGUMENTS