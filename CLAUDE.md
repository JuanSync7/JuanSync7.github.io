# JuanSync7.github.io — Project Rules

These rules apply to all code in this repo. They are enforced where possible by the toolchain (`tsconfig`, ESLint) and otherwise by review. **Future LLM contributions must follow them.**

## Architecture

- **Active stack:** Astro + React + TypeScript, in `astro/`. Static output, deployed to GitHub Pages at https://juansync7.github.io.
- **Legacy stack:** Root-level `index.html` + `*.jsx` files using browser-side babel-standalone. Kept temporarily during migration. Do **not** add new features to the legacy files. Port to the Astro app instead.
- **Conflicting Next.js app** in `src/`: deprecated. Do not touch except to delete once the Astro port is complete.

## TypeScript rules

1. **No `as any`. No `: any`. No `// @ts-ignore`, `// @ts-expect-error`, or `// @ts-nocheck`** to silence the type checker. If types don't fit, define a real interface or fix the underlying shape. The only acceptable escape hatch is `unknown` followed by a runtime narrowing check.
2. **No type widening to make code compile.** If `Foo | undefined` is showing up, handle the undefined case — don't change the type to `Foo`.
3. **Strict mode stays on.** `tsconfig.json` extends `astro/tsconfigs/strict`. Do not loosen flags without an explicit decision recorded here.
4. **`unknown` is preferred over `any` at boundaries** (parsing JSON, third-party APIs without types). Narrow with type guards before use.
5. Prefer `interface` for object shapes that may be extended; `type` for unions and computed types.

## Component & file structure

1. **One component per file.** The headline component is the default export.
2. **Max 200 lines per `.tsx` file** (excluding imports/types). Hitting this is a signal to split, not a rule to bend.
3. **Co-locate by section.** Each major section gets its own folder under `src/components/<section>/` containing its `.tsx` files, optional `types.ts`, and component-scoped CSS.
4. **Shared primitives** go in `src/components/ui/` (buttons, cards, glow effects, etc.).
5. **Layout chrome** (Nav, Footer) lives in `src/components/layout/`.
6. **Naming:** PascalCase for components, kebab-case for CSS files, camelCase for hooks (`useFoo`).

## Styling rules

1. **Design tokens are mandatory.** Colors, gradients, spacing, font stacks, radii, shadows must come from CSS variables defined in `astro/src/styles/tokens/`. Hardcoded hex/rgb values, raw `linear-gradient(...)` literals, or magic pixel values in component CSS are not allowed.
2. **Tokens are the single source of truth.** If a value isn't in tokens, add it there first, then reference via `var(--token-name)`.
3. **Component-scoped CSS** lives next to the `.tsx` (e.g. `cockpit/cockpit.css`), imported by the component. Site-global CSS (reset, typography, layout primitives) lives in `astro/src/styles/`.
4. **No Tailwind.** Plain CSS + variables is the chosen idiom. Don't introduce utility-class systems.

## React rules

1. **No globals.** No `window.Foo = Foo`, no implicit reliance on script-tag load order. Use ESM imports.
2. **Effects must clean up.** Every `addEventListener`, `setInterval`, GSAP tween, etc. has a matching teardown in the `useEffect` return.
3. **No `dangerouslySetInnerHTML`** unless content is from MDX or sanitized markdown — never user input.
4. **Memoization is opt-in, not reflexive.** Don't wrap things in `useMemo`/`useCallback` unless there's a measured reason.

## Commits

- Branch off `develop` for migration work; merge to `main` only when a milestone is shippable.
- Conventional-commit-ish prefixes (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`) keep history scannable.

## Doing the work

- Don't introduce abstractions for hypothetical futures. Three repetitions is the bar for extraction.
- Don't write comments that restate the code. Comments are for *why*, not *what*.
- Don't add backwards-compat shims to legacy `*.jsx` files — they're being replaced wholesale.
