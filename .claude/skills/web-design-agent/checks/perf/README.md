# Performance probes

Three probes for WEB-PERF-1 to 7, run against a built site served locally. Each takes the site's
`astro` folder (for its Playwright install), the base URL and two paths: the page to start on and
the page to click through to. Set `CHROME` to a Chrome binary to use it instead of Playwright's own.

| Probe | Answers | Passes when |
|---|---|---|
| `block.mjs` | Is the page turn played by the compositor? Blocks the main thread for 700 ms mid-turn and counts the new pictures the screen shows. | 3 or more (exit 0); the main-thread turn shows 1 |
| `lag.mjs` | Which long tasks run as a page lands, and which script is behind each (CPU profile). | Not a gate yet: the budgets per page type and per figure are proposed (WEB-PERF-3) |
| `smooth.mjs` | How many pictures a real turn shows and its longest gap, with the landing page building as normal. | Not a gate: compare old and new on the same machine (WEB-PERF-7) |

```sh
npm run build && npx astro preview --port 4321 &
node block.mjs <site>/astro http://localhost:4321 /about/ /lab/
node lag.mjs <site>/astro http://localhost:4321 /about/ /#work
node smooth.mjs <site>/astro http://localhost:4321 /about/ /vault/
```

Measured on 22 November 2026 (headless Chrome, 2 cores, no GPU): `block.mjs` gave 1 picture for
the old turn and 4 to 7 for the compositor turn; `smooth.mjs` into a light page gave 3 pictures for
the old turn and 8 to 16 for the new. Without a GPU the numbers are relative only.
