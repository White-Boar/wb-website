---
description: Create the backlog.
---

The user input to you can be provided directly by the agent or as a command argument - you **MUST** consider it before proceeding with the prompt (if not empty).

User input:

$ARGUMENTS

1. Run `.specify/scripts/bash/check-prerequisites.sh --json` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute.

2. Load and analyze tasks:
   - Always read tasks.md for tech stack and libraries

3. Verify backlog.md is empty:
   - If the file FEATURE_DIR/backlog.md exists and is not empty, do not proceed. Report back to the user 'Backlog file exists and is not empty'.

4. Generate the backlog following the template:
   - Use `.specify/templates/backlog-template.md` as the base
   - Replace example tasks with actual tasks based on:
     * **Read tasks**: read all tasks from tasks.md
     * **Keep order**: Keep the tasks in the same order they are in tasks.md
     * **Format**: stick to the format specified in the template
     * **Status**: All tasks have a status [Planned]
     * **Notes**: Make sure all tasks notes exist in the backlog: Clear file paths for each task, Dependency notes, Parallel execution guidance

5. Create FEATURE_DIR/backlog.md with:
   - Each taks in order 
   - Following the format rules
   - With status [Planed]
   - With all the taks details

6. Report results with file paths, and generated artifacts.

Context for task generation: $ARGUMENTS

