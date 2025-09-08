# index.md
This file provides guidance to AI Agents when working with code in this repository.

## Business case
Please reference './whiteboar-business-overview.md'.

## Non-functional Requirements
| Requirement      | Acceptance criteria                                                                                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Performance**  | Largest Contentful Paint ≤ 1.8 s, CLS < 0.1 on mobile Lighthouse. No unused JS > 50 KB.                                                                                                                                     |
| **Responsive**   | Works from 320 px to 1920 px. Tailwind breakpoints only.                                                                                                                                                                    |
| **SEO**          | Next `<Metadata>` with unique `title`, `description`, Open Graph, canonical, lang alternates (`en`, `it`). All images `alt=""` (localized).                                                                                 |
| **Multilingual** | Use `next-intl` for runtime messages. Provide one `en.json` and `it.json` per component with the copy below. Default locale = `en`; fall-back to `en`. URL base path `/it` for Italian.                                     |
| **Accessible**   | Passes axe-core with zero critical issues. Keyboard nav, focus rings (`focus-visible:outline-accent`).                                                                                                                      |
| **Light & Dark** | Implement theme switcher with shadcn/ui `Theme` + Tailwind `dark:` utilities. Persist choice in `localStorage`.                                                                                                                 |
| **Testing**      | Jest + React Testing Library unit tests for each component (interaction & aria). Playwright e2e that: ① loads `/`, ② switches language, ③ toggles dark/light, ④ selects pricing plan, ⑤ checks CLS < 0.1 with `web-vitals`. |
| **CI**           | Include `github/workflows/test.yml` running `pnpm test` & playwright.                                                                                                                                                       |


## Design
Please reference the design system under './context/design-system'.

## Testing Details

    Unit (Navigation.test.tsx, etc.): Render + assert role structures, theme toggling, translation switch calls next-intl hook.

    Integration (PricingTable.int.test.tsx): Select plan ► open Add-ons ► totals update. Mock next/navigation.

    e2e (home.spec.ts Playwright):

        Visit / (assert 200, h1 visible).

        Click Italian → url === '/it', text switches.

        Toggle dark → <html class="dark">.

        Select “Fast & Simple” ► route contains plan=fast.

        Collect CLS metric via web-vitals.

## Additional Notes

    Images: Store all raster assets in /public with modern formats (prefer .webp); supply 1.5× and 2× via next/image srcSet.

    Fonts: Use NextJS Fonts API Montserrat:wght@600;700&display=swap and Inter:400..700. Preconnect to fonts.gstatic.com.

    Analytics: Add commented placeholder for Vercel Analytics script—do not load in dev.

    CI: Use circleci, Cache node_modules, run next lint, next build after tests.