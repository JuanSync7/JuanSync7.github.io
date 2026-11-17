/* The page turn and the new page's heavy work share one main thread. The curl is painted
   frame by frame on it, so a figure that loads and compiles while the page turns (a card
   cover's WebGL, say) freezes the turn and the reader sees only its first and last frames.
   page-curl.ts marks a turn here; anything heavy on the incoming page waits for afterTurn(). */

let current: Promise<void> = Promise.resolve();

/** Marks a turn in progress until `done` settles, however it settles. */
export function holdTurn(done: Promise<unknown>): void {
  current = done.then(
    () => undefined,
    () => undefined,
  );
}

/** Resolves once no page turn is running: at once when there is none. */
export function afterTurn(): Promise<void> {
  return current;
}
