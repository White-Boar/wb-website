# WhiteBoar Design System — Geist-inspired

> **Stack**  Tailwind CSS v3 / shadcn/ui  / Framer Motion v8 

### Purpose
The README is the **single onboarding document** for devs and designers. It explains how WhiteBoar’s visual language is encoded in code, how to extend it, and the exact rules that keep the site looking like WhiteBoar.

---

### 1 · Installation & Quick Start
```bash
pnpm i tailwindcss@latest postcss autoprefixer        @shadcn-ui/react @radix-ui/react        lucide-react framer-motion

pnpm dlx tailwindcss init -p # if not already
```
* `npm run dev` runs Next/Vite with Tailwind in watch mode.
* `npm run lint:css` invokes Stylelint using **stylelint.config.cjs**.

---

### 2 · Folder Map
```
whiteboar-design-system/
├─ tokens.css            # ← design decisions in variables
├─ tailwind.config.js    # ← reads those variables
├─ shadcn-theme.ts       # ← Radix/shadcn theme bridge
├─ motion/variants.ts    # ← Framer Motion presets
├─ stylelint.config.cjs  # ← enforces CSS conventions
└─ README.md             # ← you’re here
```

---

### 3 · Design Foundations (Tokens)
| Token | Usage Guideline | Tailwind alias |
|-------|-----------------|----------------|
| `--wb-color-accent` (`#FFD400`) | Primary action colour — use for CTAs, form focus rings, link underline hover. Keep ≤ 10 % area per screen. | `text-accent` / `bg-accent` |
| `--wb-gray-900…100` | Neutral greyscale for text, borders, backgrounds. **Never** tint greys. | `text-gray-900`, `bg-gray-100`, etc. |
| `--wb-font-heading` | Montserrat; use for all headings `h1–h3`. Keep hero H1 ≤ 60 chars. | `font-heading` |
| Spacing 1–8 | 4 → 64 px Geist cadence. Margin & gap utilities only—**no magic numbers**. | `gap-4`, `mt-6`, etc. |
| Radius lg (8 px) | Apply to cards, inputs, buttons. | `rounded-lg` |
| Elevation sm–lg | Use `shadow-sm` only on cards & nav. Never on text. | `shadow-sm` |

Dark mode → toggle `.dark` on `<html>` and re-declare only colour variables.

---

### 4 · Component Pattern
1. **Primitive** Generate with shadcn CLI (`npx shadcn add button`).
2. **Wrap** with Tailwind classes for layout/colour. Example:  
   ```tsx
   export function WBButton(props: ButtonProps) {
     return (
       <Button className="bg-accent text-black hover:opacity-90" {...props} />
     );
   }
   ```
3. **Document** in `/app/docs` route with MDX.

Naming: `WB<Component>` for branded wrappers, keep Radix names for inner parts.

---

### 5 · Animation Usage (Framer Motion)
* Import presets from `motion/variants.ts`.
* Use `prefers-reduced-motion` guard:  
  ```tsx
  const shouldReduce = useReducedMotion();
  <motion.div variants={shouldReduce ? {} : fadeInUp}>
  ```
* Durations ≤ 200 ms, cubic-bezier `.25,.8,.25,1`.

Common patterns:
| Variant | Where to use | Example |
|---------|--------------|---------|
| `fadeInUp` | Hero heading, section intro | `<motion.h1>` |
| `slideFade('left')` | Sidebar, off-canvas nav | `<motion.aside>` |
| `staggerChildren` | Icon lists | Wrapper div |

---

### 6 · Accessibility
* Maintain WCAG AA contrast – see colour table above.
* All interactive elements = `focus-visible:outline-accent`.
* Radix primitives handle keyboard nav; **never** strip their default focus traps.

---

### 7 · Voice & Micro-copy Cheatsheet
| Principle | Do | Avoid |
|-----------|----|-------|
| **Confident** | “Launch in days, not months.” | “We might be able to…” |
| **Efficient** | “2-step checkout” | Verbose legalese upfront |
| **Empowering** | “Big presence, small effort.” | Patronising tone |

---

### 8 · Extending the System
1. Add a new token → update `tokens.css` **then** `tailwind.config.js`.
2. Run `npm run lint:css` to ensure no hard-coded colours crept in.
3. Ship.

---

© 2025 WhiteBoar 
