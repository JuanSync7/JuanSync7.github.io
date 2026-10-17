# The rules

Thirteen rules, at three levels. **Invariants** are enforced by `check.mjs` or `look.mjs`
and a figure that breaks one does not pass. **Craft** rules are judged from the sheet
(`look.md`). **Framing** rules are decided before any code. Each rule says how to keep it
with the kit and what gets a figure rejected.

Sources: the restraint and the two clocks come from hairline (lucasmarkes/hairline); "the
object is the explanation" and "verify like a critic" from anatomy (wheresryan22/anatomy);
the brush and the noise from shan-shui-inf (LingDong-).

## Framing

### 01 · object: the subject, drawn as a thing
Find the object whose working is the idea, then draw that.
- **Keep it:** write the `idea` field first: the object, what moves, what the motion means.
  If you can't write it in one sentence, you don't have a concept yet.
- **Rejected when:** boxes joined by arrows; a shape with a label on it; an icon (a padlock
  for security); a figure you can't explain without its caption. If words are the content,
  build a DOM diagram with real text instead.

### 02 · one: one figure, one idea
One object, one motion, one answer to the pointer.
- **Keep it:** if a second idea creeps in, it is a second figure or nothing.
- **Rejected when:** two things move for two reasons; the figure needs a legend.

### 03 · variety: a page is a set, not a stamp
Figures that sit together use different techniques. *(invariant: `variety`, `covers`)*
- **Keep it:** run `npm run figures:check -- --list` before choosing. Within a group no style
  covers more than a third; posts next to each other by date never share a style.
- **Rejected when:** the same technique with a different shape, again and again. Changing
  the model from a sphere to a torus is not variety; changing from wireframe to pixel is.

## Invariants

### 04 · palette: colour only from the tokens
*(invariant: `colour`, `palette`)*
- **Keep it:** `ink.line(a)`, `ink.signal(a)`, `ink.ground()`, `tone(key, a)`, `mix(a, b, t)`,
  `hexOf(key)` for three.js. Need a new colour? Add a `--nt-*` token and its `night` mirror
  first, in its own commit, and say why.
- **Rejected when:** any colour literal in the file; any pixel whose hue is neither grey nor
  the signal.

### 05 · signal: the teal is information
At rest, one bright mark says where to look. When the pointer chooses, the bright moves to
what it chose. *(invariant: `signal` at most 35% of the ink; a figure with no signal warns)*
- **Keep it:** decide what the one lit thing is (the decoding ridge, the active die, the
  cursor). Everything else is grey at an opacity that says its depth.
- **Rejected when:** the signal fills areas; two unrelated things are lit; the signal is
  decoration.

### 06 · weight: hairlines, no glow
*(invariant: `width`, `glow`)*
- **Keep it:** 1px strokes. Say importance with opacity and the signal; say depth by fading
  far lines. Fills are ground or a face tone, used to hide what is behind (painter's order),
  never to decorate.
- **Rejected when:** `shadowBlur`, filters, gradients, blend modes, lines wider than 1.5px.

### 07 · clock: the loop owns time
*(invariant: `clock`, `dom`, `random`, `reduced`)*
- **Keep it:** read `t`, `dt`, `hover`, `pointer`, `pulses`, `still` from the frame. A
  continuous input follows on a spring or `follow`; a discrete change eases out over ~700 ms
  (`kit/motion.ts`). Randomness is drawn from the seeded `rng` in `setup`; anything that
  must vary over time samples `noise(x, t)` so it changes smoothly.
- **Under `still`, snap:** with reduced motion a pointer move redraws once with `dt = 0`, so
  anything eased with `follow` never moves. Write `x = still ? target : follow(x, target, dt)`.
- **Rejected when:** timers, listeners, `Math.random`, wall-clock reads; anything that
  re-randomises per frame (shimmer); anything still moving under reduced motion.

### 08 · words: no text in the drawing
*(invariant: `words`)*
- **Keep it:** return a few characters from `draw` (`ridge 7`, `die 3·2`, `rest`); the page
  shows them as the read-out. Number things with dots or position.
- **Rejected when:** `fillText`; letters or digits drawn as paths; a figure that can't be read
  without its read-out.

### 09 · budget: small, fast, seeded
*(invariant: `length`, `perf`, `blank`, `wash`)*
- **Keep it:** under 200 lines; under 6 ms a frame on average (14 ms for three.js); ink
  between 0.4% and 50% of the frame, ideally under 40%. Precompute geometry in `setup`;
  `draw` only moves and paints.
- **Rejected when:** thousands of marks for a texture you can't see at 358 px; a frame that
  is mostly ink.

## Craft

### 10 · rest: the still frame is the thumbnail
Under reduced motion, and in every capture, the figure is its rest frame. It must hold up
alone. *(look questions 1 and 2)*
- **Keep it:** compose rest on purpose: an asymmetry, a lean, one thing lit. Readers with
  reduced motion see the figure at 1.2 s (`REST_T` in the clock): that is the sheet's
  "reduced motion" picture, so judge rest there too. The audit's rest and phone shots are
  taken earlier, at 0.8 s, and must hold up as well.
- **Rejected when:** rest is a flat grid, an empty field, or a frame that looks unfinished.

### 11 · motion: it moves because it means something
*(look question 3; invariant `motion` checks that ambient figures move and the others don't)*
- **Keep it:** say what the motion means in the `idea` field, and make that true: the lit
  ridge walks one step per token; the wave runs along the array's diagonal.
- **Rejected when:** motion as wallpaper; uniform speed everywhere; anything faster than the
  eye can follow at rest.

### 12 · answer: local, with a falloff
When a figure answers the pointer, the answer is near the pointer and falls off with
distance, and the read-out names what is under it. *(invariant `answer` checks it changes)*
- **Keep it:** `pointer.x`, `pointer.y` are 0..1 across the canvas; ease toward them; clamp
  every lift so the far end of the answer still fits the frame. Pick from the rest pose, not
  the pose on screen, or the hover flickers.
- **Rejected when:** the whole figure changes at once; the answer leaves the frame; the
  read-out is a sentence.

### 13 · depth: near is brighter than far
Every 3D figure fades with depth and keeps the painter's order. *(look question 6)*
- **Keep it:** `nearness(depth)` for opacity; sort faces back to front (`shadeMesh` does);
  fill a solid with ground before stroking it so far lines don't show through.
- **Rejected when:** a far edge crosses a near face; every edge has the same weight.
