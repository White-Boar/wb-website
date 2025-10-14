---
description: Execute the implementation plan by processing and executing all tasks defined in the current sprint
---

The user input can be provided directly by the agent or as a command argument - you **MUST** consider it before proceeding with the prompt (if not empty).

User input:

$ARGUMENTS

## Architecture

This command acts as an **orchestrator** that:
1. Loads sprint context and validates prerequisites
2. Launches the `task-coder` agent for each task sequentially
3. Validates post-sprint requirements (tests, build, backlog consistency)
4. Handles git commit

The `task-coder` agent handles all task-specific work (TDD cycle, implementation, validation). This command handles fixing any test or build failures.

## Implementation

### Step 1: Prerequisites and Sprint Loading

1. Run `.specify/scripts/bash/check-prerequisites.sh --json` from repo root and parse FEATURE_DIR

2. Load sprint file (sprint-XXX.md from FEATURE_DIR):
   - If sprint number provided: Use that sprint file
   - If not provided: Find most recent sprint file
   - If no sprint files found: ERROR "No sprint found. Run /plan-sprint first"

3. Load context for troubleshooting:
   - Read FEATURE_DIR/spec.md
   - Read FEATURE_DIR/backlog.md
   - Read FEATURE_DIR/plan.md
   - IF EXISTS: Read FEATURE_DIR/data-model.md
   - IF EXISTS: Read FEATURE_DIR/contracts/

4. Parse sprint file and extract:
   - Sprint number and goal
   - All tasks with IDs, descriptions, priorities, acceptance criteria
   - Task dependencies

5. Display sprint summary:
   ```
   Sprint [N]: [Sprint Goal]
   Tasks: [X] total ([Y] P0, [Z] P1, [W] P2)
   Estimated: [X] hours
   ```

### Step 2: Task Execution Loop

For each task in the order listed in the sprint file:

1. Display task header:
   ```
   ═══════════════════════════════════════════
   Task [ID]/[TOTAL]: [Description]
   Priority: [P0/P1/P2] | Estimate: [X hours]
   ═══════════════════════════════════════════
   ```

2. Launch task-coder agent with:
   ```
   Execute task [ID] from sprint [N].
   ```

3. Wait for task-coder agent to complete and report artifacts

4. If agent reports failure or gets stuck:
   - Review the failure details
   - Load relevant files to diagnose
   - HALT and report back to the user.

5. Display task completion:
   ```
   ✅ Task [ID] complete
   ```

### Step 3: Sprint Validation

After all tasks executed:

#### 3a. Run Full Test Suite

Execute tests:
```bash
pnpm test && pnpm test:e2e
```

**CHECKPOINT**: All tests MUST pass
→ If ANY test fails:
  - Review test failures and diagnose root cause.
  - HALT and report back to the user.

Report test counts and performance

#### 3b. Run Production Build

Execute:
```bash
pnpm next build
```

**CHECKPOINT**: Build MUST succeed
→ If fails:
  - Review build errors and diagnose root cause.
  - HALT and report back to the user.

#### 3c. Verify Sprint Goal

Count completed tasks in backlog:
```bash
grep -c "→ Sprint [N] - Completed" [FEATURE_DIR]/backlog.md
```

**CHECKPOINT**: All tasks MUST be [Done]
→ If any task not [Done]: HALT "Sprint incomplete - [X] tasks remaining: [list task IDs]"

Report: `✅ Sprint goal achieved: All tasks complete`

### Step 4: Verify Backlog Consistency

1. Count tasks in sprint file's "Selected Tasks" section
2. Count completed tasks in backlog (grep command from 3c)

**CHECKPOINT**: Counts MUST match
→ If mismatch: Fix backlog.md to reflect actual completions

Report: `✅ Backlog verified: [count] tasks marked [Done]`

### Step 5: Git Commit

1. Stage all changes: `git add .`

2. Create commit.

3. Execute commit using HEREDOC format

### Step 6: Final Report

Display:
```
Sprint [N] Complete

Tasks: [X]/[X] ✅
Tests: [X] passed
Build: ✅ Success
Commit: [hash]
```

## Error Handling

- **Task failures**: Diagnose, halt and report to user and ask if to attempt to resolve

## Success Criteria

Sprint succeeds when:
- All tasks completed with [Done] status
- All tests passing
- Production build succeeds
- Backlog consistent
- Code committed

Context for sprint implementation: $ARGUMENTS
