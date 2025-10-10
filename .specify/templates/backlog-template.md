# Backlog: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required),  tasks.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load tasks.md from feature directory
   → If not found: ERROR "No tasks found"
   → Extract: tasks
3. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
4. Generate backlog, order by phase:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply backlog tasks rules:
   → ID = task ID
   → Phase = implementation phase
   → Descriotion = task description
   → Status = Planned / WIP / Done
5. Number backlog tasks sequentially (T001, T002...)
9. Return: SUCCESS (backlog ready for execution)
```

## Format: `[ID] [Phase] Description [Status]`
- **[Status]**: Tasks can be in `Planed` phase (work has not started), `WIP` phase (work has started) or `Done` phase (work has finished).

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Backlog
- T001 [Phase 3.1: Setup] Create project structure per implementation plan [Planed]
   - Clear file paths for each task
   - Dependency notes
   - Parallel execution guidance
- T002 [Phase 3.2: Tests First] Initialize  project with dependencies [Planed]
   - Clear file paths for each task
   - Dependency notes
   - Parallel execution guidance
- T003 [Phase 3.3: Core Implementation] Configure linting and formatting tools [Planed]
   - Clear file paths for each task
   - Dependency notes
   - Parallel execution guidance

## Notes
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Validation Checklist
*GATE: Checked by main() before returning*
- [ ] All tasks from tasks.md exits in backlog.md