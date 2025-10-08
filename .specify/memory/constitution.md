<!--
Sync Impact Report:
Version: 1.1.0 → 2.0.0 (Amendment: Agile methodology principles integrated)
Modified Principles: Major restructure - Agile methodology principles now supersede existing principles
Added Principles:
  - Agile Methodology section (9 core agile principles at top)
  - All existing principles moved under "Product Development Principles"
Modified Sections:
  - Complete restructure: Agile → Product → Development → QA → Governance
  - Compliance Review: Updated to include agile checklist items
Templates Status:
  - ⏳ plan-template.md: Needs update for sprint planning workflow
  - ⏳ spec-template.md: Needs update for backlog integration
  - ⏳ tasks-template.md: Needs update for sprint tasks and DoD
  - ⏳ commands/*.md: Review needed for agile workflow integration
Follow-up TODOs:
  - Update plan-template.md with sprint planning format
  - Update tasks-template.md with DoD checklist
  - Create backlog.md if not exists
  - Review commands for agile compatibility
-->

# WhiteBoar Website Constitution

## Agile Methodology Principles

We are working using an Agile methodology with the following core principles:

### 1. Work in Short, Focused Sprints
You deliver in small increments. Each sprint is a time-boxed phase with a single clear goal. No sprint should exceed one week. Break large initiatives into sprint-sized chunks.

**Rationale**: Short sprints reduce risk, enable faster feedback loops, and keep momentum high. Time-boxing forces prioritization and scope clarity.

### 2. Start with Tests (TDD)
Follow Test-Driven Development. Write or request tests first. Implement the minimum code to pass the tests. Refactor only after the tests are green.

**Rationale**: Tests-first ensures you build what's specified, prevents over-engineering, and creates a safety net for refactoring. Red-Green-Refactor is non-negotiable.

### 3. Pull from a Single Backlog
All work lives in one prioritized backlog of high-level tasks at `context/backlog.ms`. Do not invent side work outside the backlog. If new work emerges, add it to the backlog and reprioritize.

**Rationale**: A single backlog ensures transparency, prevents scope creep, and focuses effort on highest-value work. Shadow work creates waste.

### 4. Plan Every Sprint
At the start of a sprint, define a sprint goal. Select the smallest set of backlog items needed to hit that goal. Then research, propose an architecture, break items down, and clarify acceptance criteria. Present this plan and ask for approval before starting implementation.

**Rationale**: Planning reduces rework, aligns expectations, and surfaces blockers early. Approval ensures stakeholder buy-in before committing effort.

### 5. Work Iteratively and Incrementally
Ship thin slices that add up to the goal. Prefer many small merges over one big merge. Ask for missing details instead of assuming. Deliver working software frequently.

**Rationale**: Incremental delivery reduces integration risk, enables early course correction, and maintains continuous value flow. Big-bang releases are anti-agile.

### 6. Definition of Done
A task is done only when:
- ✅ Code matches the visual design verified using playwrite mcp
- ✅ Tests pass (unit, integration, e2e)
- ✅ Build passes
- ✅ Change is deployed to production
- ✅ Documentation is updated (if applicable)
- ✅ Acceptance criteria are met

If any part is missing, it is not done.

**Rationale**: Strict DoD prevents incomplete work from accumulating as technical debt. "Done" means shippable, not "coded."

### 7. Always Deliver Client Value
Every sprint must ship something the client can use or learn from. If a task does not move the needle, de-scope it. Features without user impact are waste.

**Rationale**: Value delivery is the only measure of progress. Internal refactoring or "nice-to-haves" must be justified by client benefit.

### 8. Keep the Backlog Fresh
After each sprint:
- Add tasks that emerged during the sprint
- Remove or merge duplicates
- Reprioritize to maximize client value
- Archive completed items

**Rationale**: A stale backlog leads to wasted effort and misaligned priorities. Continuous grooming keeps the backlog actionable.

### 9. Make Work Visible
Document decisions, assumptions, risks, and trade-offs in code comments, commit messages, and specification files. Link code to tests and tickets. Keep status up to date in the backlog.

**Rationale**: Transparency reduces handoff friction, enables async collaboration, and creates institutional knowledge. Hidden work creates waste.

### 10. Fix Causes, Not Symptoms
Never ship a workaround. When encountering bugs or issues, find the root cause, prove it with a failing test, and fix it properly. Rewrite parts that no longer fit your current understanding. Workarounds accumulate as technical debt and mask deeper problems.

**Rationale**: Quick fixes and workarounds create maintenance nightmares, hide systemic issues, and violate the TDD principle. Root cause fixes prevent recurring bugs and improve code quality. If code doesn't match your mental model, the code is wrong.

### 11. Build the Minimum That Works
Solve the need with the smallest coherent change while keeping code, architecture, and product quality high. Avoid bloat. Every line of code is a liability—write only what's necessary to meet the acceptance criteria. Prefer simple solutions over clever ones.

**Rationale**: Minimal solutions are easier to test, maintain, and evolve. Over-engineering wastes time, increases complexity, and introduces bugs. "Good enough" shipped beats "perfect" planned. YAGNI (You Aren't Gonna Need It) is law.

---

## Product Development Principles

### I. User-First Design
Every feature MUST prioritize small business owners' needs over technical elegance. The platform targets users with limited time, budget, and technical expertise. All UX decisions MUST eliminate jargon, minimize friction, and deliver immediate value. Features that require technical knowledge to operate are prohibited unless absolutely necessary for the business model. The UX must be top world class.

**Rationale**: WhiteBoar's core value proposition is "no jargon, no hassle, just results" for small businesses. Complex interfaces or technical requirements directly undermine this promise and reduce market fit.

### II. AI-Driven Automation
All feature implementations MUST leverage AI automation where human input can be eliminated or reduced. Manual processes are acceptable only when AI cannot reliably deliver quality results or when user input is legally/strategically required (e.g., business information, brand preferences). Features that add manual workflows without clear justification violate this principle.

**Rationale**: The platform's competitive advantage is end-to-end automation from onboarding to deployment. Manual processes increase support costs, reduce scalability, and weaken the "live in days, not months" promise.

### III. International-Ready by Default
All user-facing content MUST use `next-intl` with complete translations in both English and Italian. No hard-coded strings in components. All new features MUST include translation keys in both `messages/en.json` and `messages/it.json`. URL structure MUST maintain `/` for English and `/it` for Italian. Server-side translations MUST use `getTranslations()` for metadata and SEO.

**Rationale**: WhiteBoar targets Italy first, then Europe, then worldwide. Building multilingual support retroactively is expensive and error-prone. International readiness from day one is a core business requirement, not a feature.

### IV. Performance & Web Standards (NON-NEGOTIABLE)
All features MUST meet these thresholds before merging:
- Largest Contentful Paint ≤ 1.8s (mobile Lighthouse)
- Cumulative Layout Shift < 0.1
- No unused JavaScript bundles > 50KB
- All images MUST use Next.js `<Image>` with `alt` attributes (localized)
- Playwright e2e tests MUST validate LCP and CLS using `web-vitals` library

**Rationale**: These are contractual requirements from `context/index.md`. Poor performance directly impacts SEO rankings and user trust. Mobile-first performance is critical for small business customers accessing the site from smartphones.

### V. Accessibility Standards (NON-NEGOTIABLE)
All features MUST pass axe-core validation with zero critical issues. Keyboard navigation MUST work for all interactive elements using `focus-visible:outline-accent`. Semantic HTML and proper heading hierarchy are mandatory. All ARIA labels MUST be localized. Screen reader testing MUST be included in Playwright e2e suites.

**Rationale**: WCAG AA compliance is legally required in many European markets and morally essential. Accessibility improves SEO and expands market reach to users with disabilities.

### VI. Design System Consistency
All styling MUST use CSS custom properties from `context/design-system/tokens.css`. Hard-coded color values, spacing, or typography are prohibited. Tailwind configuration MUST consume `--wb-*` variables only. All shadcn/ui components MUST be customized using design tokens. Theme switching (light/dark) MUST use localStorage with system preference fallback.

**Rationale**: The design system is the single source of truth for WhiteBoar's brand identity. Inconsistent styling creates maintenance debt and dilutes brand recognition. CSS custom properties enable theme switching and brand evolution without code changes.

### VII. Test-Driven Development
Tests MUST be written before implementation:
1. Unit tests (Jest + React Testing Library) for all components covering rendering, interactions, accessibility attributes, and keyboard navigation
2. Integration tests for multi-component flows (e.g., pricing plan selection)
3. E2E tests (Playwright) for critical user journeys including language switching, theme toggling, and performance validation

Red-Green-Refactor cycle is mandatory. Features without passing tests cannot be merged.

**Rationale**: TDD ensures features meet specifications, reduces regression bugs, and provides living documentation. E2E tests validate contractual requirements (performance, accessibility) that cannot be checked manually.

### VIII. Session & State Management
All client-side state persistence MUST include:
- Schema versioning for migration compatibility
- Graceful degradation when stored data is invalid/outdated
- Clear expiration policies (default: 7 days for user sessions)
- State cleanup utilities for testing and user-initiated resets
- Recovery mechanisms for corrupted state

**Rationale**: localStorage persistence without versioning causes production bugs when state schemas evolve. Migration handling prevents data loss and user frustration. Testing reliability requires deterministic state cleanup.

### IX. Backward Compatibility & Migration
Schema changes (database, API, client state) MUST include:
- Migration scripts/utilities tested before deployment
- Backward-compatible transitions (support old + new formats during migration window)
- Rollback procedures for failed migrations
- User-facing migration status/progress indicators for long operations
- Version checks to detect incompatible data formats

**Rationale**: Schema changes without migration cause data loss and production outages. Supporting multiple versions during transition prevents breaking existing users.

## Development Standards

### Technology Stack Requirements
- **Framework**: Next.js 15+ with app directory and TypeScript
- **Internationalization**: next-intl with server-side translations
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS consuming design tokens via `--wb-*` variables
- **Animation**: Framer Motion with `useReducedMotion()` support
- **Testing**: Jest, React Testing Library, Playwright, axe-core

New technology choices MUST be justified against existing stack and approved before implementation.

### File Organization
- Each major section = separate component file
- Components in `/components`, UI primitives in `/components/ui`
- Tests co-located in `__tests__/components/` or `__tests__/e2e/`
- Translations in `messages/{locale}.json`
- Design system in `context/design-system/`

### Code Quality Standards
- TypeScript strict mode required
- ESLint MUST pass before commits
- Stylelint MUST validate CSS against design system rules
- All components MUST have corresponding unit tests
- Critical user flows MUST have E2E coverage

### Development Workflow Rules
- **Single Server Rule**: Only one development server per port. Check for running processes before starting new servers (`lsof -i :3000`).
- **Port Conflict Prevention**: Kill orphaned processes before debugging "port in use" errors.
- **Clean Restart Protocol**: Use `pnpm dev` for fresh starts; avoid layering multiple server instances.

## Quality Assurance Standards

### Testing Requirements
1. **Unit Tests**: All components tested for rendering, interactions, theme switching, language selection
2. **Integration Tests**: Multi-component flows with mocked navigation
3. **E2E Tests**: Homepage loading, language switching, theme toggle, pricing selection, performance metrics (LCP, CLS), accessibility validation
4. **Playwright Best Practices**:
   - Always clear localStorage to avoid test inconsistencies
   - Use `storageState: undefined` in config for fresh contexts
   - Use `ensureFreshOnboardingState(page)` helper for clean state
   - Always use restart button functionality between test runs

### CI/CD Pipeline
GitHub Actions workflow (`.github/workflows/test.yml`) MUST validate:
1. ESLint code quality checks
2. Jest unit tests with coverage thresholds
3. Next.js production build success
4. Playwright e2e tests including performance validation
5. Accessibility testing with axe-core

Failing CI blocks merges. No exceptions.

### Manual Validation
After UI changes, developers MUST use Playwright MCP to validate:
- Light and dark themes render correctly
- Mobile and desktop layouts function properly
- All interactive elements are keyboard accessible
- Performance metrics remain within thresholds

### Conversion Metrics (Multi-Step Flows)
User flows with measurable conversion goals MUST define and monitor:
- **Completion Rate**: Target ≥25% for multi-step onboarding flows
- **Time-to-Complete**: Target ≤15 minutes for onboarding processes
- **Mobile Completion**: Target ≥40% on mobile devices
- **Drop-off Analysis**: Track abandonment at each step

E2E tests SHOULD validate happy-path completion time.

## Governance

### Amendment Process
This constitution supersedes all other development practices and documentation. Amendments require:
1. Documented justification of why change is needed
2. Impact assessment on existing features and workflows
3. Migration plan for affected code and tests
4. Approval from project maintainers before implementation

### Compliance Review
All pull requests MUST include a constitution compliance checklist:

**Agile Compliance:**
- [ ] Sprint goal clearly defined and approved before implementation
- [ ] Work pulled from `context/backlog.ms` (no shadow work)
- [ ] Tests written before implementation (TDD - Red/Green/Refactor)
- [ ] Definition of Done met (tests pass, reviewed, deployed, documented)
- [ ] Client value clearly articulated and delivered
- [ ] Work delivered incrementally (small, frequent merges)
- [ ] Backlog updated with emerging tasks and reprioritized
- [ ] Decisions, assumptions, and trade-offs documented

**Product Development Compliance:**
- [ ] User-first design validated (no unnecessary complexity)
- [ ] AI automation opportunities explored
- [ ] Translations complete (en.json + it.json)
- [ ] Performance thresholds met (LCP ≤ 1.8s, CLS < 0.1)
- [ ] Accessibility validated (axe-core passes)
- [ ] Design tokens used (no hard-coded styles)
- [ ] State persistence includes versioning and migration (if applicable)
- [ ] Schema changes include migration scripts and rollback (if applicable)
- [ ] Conversion metrics defined for multi-step flows (if applicable)

### Versioning Policy
Constitution versions follow semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Backward-incompatible principle removals or redefinitions
- **MINOR**: New principle/section added or materially expanded guidance
- **PATCH**: Clarifications, wording fixes, non-semantic refinements

### Runtime Development Guidance
For day-to-day development guidance and best practices, developers should reference:
- `CLAUDE.md` (for Claude Code AI agent)
- `context/index.md` (non-functional requirements)
- `context/design-system/README.md` (design system usage)
- `context/whiteboar-business-overview.md` (business context)

**Version**: 2.0.0 | **Ratified**: 2025-09-30 | **Last Amended**: 2025-01-08