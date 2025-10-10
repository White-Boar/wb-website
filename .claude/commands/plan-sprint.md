---
description: Plan the next sprint by defining a sprint goal, selecting tasks and clarifying the plan. Provide a print goal as an argument.
---

The user input to you can be provided directly by the agent or as a command argument - you **MUST** consider it before proceeding with the prompt (if not empty).

User input:

$ARGUMENTS

## Configuration
**Default Sprint Duration**: 2 days
**Max Daily Capacity**: 6 hours of focused work per day
**Sprint Capacity**: 12 hours (2 days × 6 hours)

Given the sprint goal provided as an argument (or collected interactively), do this:

1. Run `.specify/scripts/bash/check-prerequisites.sh --json` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS. All paths must be absolute.

2. Load and analyze all design documentation:
   - **REQUIRED**: Read FEATURE_DIR/backlog.md for task inventory
   - **REQUIRED**: Read FEATURE_DIR/spec.md for requirements and user stories
   - **REQUIRED**: Read FEATURE_DIR/plan.md for technical architecture
   - **IF EXISTS**: Read FEATURE_DIR/research.md for technical decisions
   - **IF EXISTS**: Read FEATURE_DIR/data-model.md for entities and relationships
   - **IF EXISTS**: Read FEATURE_DIR/contracts/ for API specifications
   - **IF EXISTS**: Read FEATURE_DIR/quickstart.md for testing scenarios
   - Use this context to understand task requirements and generate acceptance criteria

3. Validate prerequisites:
   - Check that FEATURE_DIR/backlog.md exists
   - If not found: ERROR "No backlog found. Run /create-backlog first"
   - Check for any existing sprint files (sprint-*.md) to determine sprint number
   - Sprint number = highest existing sprint number + 1 (or 001 if none exist)

4. Get and validate sprint goal:
   - If $ARGUMENTS is empty or doesn't contain a clear goal:
     * Ask user: "What is the sprint goal? Describe the value this sprint will deliver to the client."
     * Wait for user response
   - Sprint goal MUST describe client value, not technical tasks
   - Examples of good goals:
     * "Enable users to complete the onboarding flow and make their first payment"
     * "Allow administrators to view and export analytics data"
   - Examples of poor goals:
     * "Implement database migrations" (too technical)
     * "Fix bugs" (not specific enough)

5. Elaborate on sprint goal:
   - Expand the goal into 2-3 sentences explaining:
     * What specific capability will be delivered
     * Who will benefit (which users/stakeholders)
     * What business value it provides
   - This elaboration will be included in the sprint file

6. Select tasks from backlog:
   - Read FEATURE_DIR/backlog.md IN FULL (all tasks, not just a sample)
   - Parse ALL tasks regardless of phase or position in file
   - Filter for tasks with [Planned] status
   - Identify tasks that contribute to the sprint goal using MULTIPLE strategies:
     * **Keyword matching**: Match goal keywords against task description, details, files
     * **Semantic matching**: Look for conceptual relationships (e.g., "payment" matches "Stripe", "checkout", "billing")
     * **Component matching**: If goal mentions a feature, find ALL tasks touching that component
     * **Dependency chains**: Include tasks that are dependencies of matched tasks
     * **Phase matching**: If goal implies a phase (e.g., "enable users" → implementation phase)
   - For borderline matches, err on the side of inclusion (can remove in clarification)
   - Calculate estimated effort for each candidate task:
     * Setup tasks: 1-2 hours
     * Test tasks: 1-2 hours
     * Implementation tasks: 2-4 hours
     * Integration tasks: 2-3 hours
     * Polish tasks: 0.5-1 hours
   - Select the minimal set that achieves the goal within capacity (12 hours)
   - If initial selection exceeds capacity, prioritize by:
     * P0: Critical path - required for goal
     * P1: Important - significantly enhances value
     * P2: Nice to have - additional polish
   - Ensure logical ordering (dependencies first)

6a. Validate comprehensive task coverage:
    - Double-check that ALL related tasks were found:
      * Re-scan backlog.md for any task containing goal-related terms
      * Check task dependencies aren't creating gaps
      * Verify no [Planned] tasks were skipped that should be included
    - If coverage seems incomplete:
      * List potentially missed tasks for user confirmation
      * Suggest search terms that might find more tasks

7. Decompose large tasks:
   - For each selected task estimated >4 hours:
     * Break into subtasks of 1-3 hours each
     * Create subtask IDs (e.g., T001.1, T001.2)
     * Each subtask must be independently testable
   - Decomposition triggers:
     * Testing is complex or multifaceted
     * Task description contains "and" connecting distinct actions
     * Task is hard to test 

8. Identify missing tasks through comprehensive gap analysis:
   - Analyze sprint goal to extract required capabilities:
     * What must be built/configured for the goal to work?
     * What must be tested for the goal to be validated?
     * What must be documented for users to benefit?
   - Cross-reference with spec.md requirements:
     * Find all requirements related to the sprint goal
     * Check if each requirement has corresponding task(s)
   - Review selected tasks for specific gaps:
     * **Functional gaps**: Missing implementation for goal features
     * **Test gaps**: Missing tests for selected implementation tasks
     * **Integration gaps**: Missing connections between components
     * **Configuration gaps**: Missing setup, environment variables, migrations
     * **Documentation gaps**: Missing user guides, API docs, README updates
   - For each identified gap:
     * Create specific task description (not generic)
     * Assign next available T### number (highest in backlog + 1)
     * Estimate effort based on task type
     * Mark as required for sprint goal
   - Validate completeness:
     * Can a user achieve the sprint goal with selected + new tasks?
     * Are all critical paths covered?
   - Add all new tasks to both sprint selection and backlog

9. Generate acceptance criteria for each task:
   - Based on documentation context (spec.md, plan.md, contracts/), create acceptance criteria:
     * For test tasks: Use contract specifications and expected responses
     * For implementation tasks: Use functional requirements from spec.md
     * For setup tasks: Use technical requirements from plan.md
   - Each task should have 2-4 specific, testable criteria
   - Criteria should be verifiable without ambiguity
   - Example:
     ```
     Task: Implement Step 1 - Personal Info component
     Generated Acceptance Criteria:
     - [ ] Component renders firstName, lastName, email fields
     - [ ] Validation blocks progression if any field is empty
     - [ ] Email field validates format (user@domain.com)
     - [ ] Form data persists when navigating away and back
     ```

10. Sequential task clarification loop (interactive):
    - Maintain in-memory list of all selected tasks (including subtasks and new tasks)
    - Present EXACTLY ONE task at a time
    - For each task in priority order:
      ```
      Task [X of Y]: [ID] [Description]

      Current details: [existing notes from backlog]
      Estimated effort: [X hours]
      Dependencies: [Task IDs this depends on]
      Files: [Specific files to modify]

      Proposed Acceptance Criteria:
      - [ ] [Generated criterion 1]
      - [ ] [Generated criterion 2]
      - [ ] [Generated criterion 3]

      Please provide (or type 'next' to accept as-is):
      a) Additional/modified acceptance criteria:
      b) Additional context or requirements:
      c) Risks or concerns:

      Type 'done' to skip remaining tasks.
      ```
    - After user responds:
      * If user types "done" or "skip remaining": Stop clarification loop, use generated criteria for remaining tasks
      * If user enters 'next': Accept all generated criteria, move to next task
      * If user provides input: Merge with generated criteria, move to next task
      * Record all clarifications in working memory (do not write to disk yet)
    - Never reveal future tasks in advance
    - Stop clarification when:
      * All tasks clarified, OR
      * User signals completion ("done", "skip remaining"), OR
      * Critical blocking issue identified (halt and report)

11. Generate sprint file:
    - Create FEATURE_DIR/sprint-[XXX].md using sprint template
    - Include:
      * Sprint number, dates (today to today+2 days)
      * Elaborated sprint goal
      * Selected tasks in priority order
      * All acceptance criteria (generated + user provided)
      * Subtask breakdowns where applicable
      * Total estimated hours vs capacity
    - Tasks format in sprint file:
      ```
      **[ID]** [Priority: P0/P1/P2] [Estimate: X hours]
      Description: [Enhanced description with clarifications]
      Acceptance Criteria:
      - [ ] [Criterion 1]
      - [ ] [Criterion 2]
      Context: [Any additional context from clarification]
      Dependencies: [Task IDs this depends on]
      Files: [Specific files to modify]
      ```

12. Update backlog status:
    - For each task selected for sprint:
      * Change status from [Planned] to [WIP]
      * Add comment: `→ Sprint XXX`
    - For new tasks identified:
      * Add to backlog as [WIP] with full details
    - Write updated backlog back to file
    - Maintain all other backlog content unchanged

13. Report results:
    - Sprint number and goal
    - Number of tasks selected
    - Total estimated hours vs capacity
    - Path to sprint file
    - Number of tasks moved to WIP
    - Any risks or concerns identified
    - Suggested next command: `/implement-sprint` or further planning

## Validation Rules
- Sprint goal must be client-value focused
- Selected tasks must fit within sprint capacity 
- All task dependencies must be included
- Tasks must be in executable order
- No task should exceed 4 hours after decomposition

## Error Handling
- If backlog is empty: ERROR "No planned tasks available"
- If no tasks match goal: WARN "No matching tasks found, consider refining goal"
- If selected tasks exceed capacity: WARN "Sprint overloaded by X hours, remove lower priority tasks"
- If circular dependencies detected: ERROR "Circular dependency in tasks: [list]"

Context for sprint planning: $ARGUMENTS