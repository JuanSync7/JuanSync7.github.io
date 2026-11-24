import { matching } from '../playbooks/match';

/** Search over the formats: a card is kept when the words it shows, its fields and values included, hold
 *  every word typed. It reads only what the page already holds, so it can find nothing a reader could not. */
export function mountFormatSearch(root: HTMLElement): () => void {
  const form = root.querySelector<HTMLFormElement>('[data-format-search]');
  const input = form?.querySelector<HTMLInputElement>('input[type="search"]');
  const result = root.querySelector<HTMLElement>('[data-format-result]');
  const empty = root.querySelector<HTMLElement>('[data-format-empty]');
  const cards = [...root.querySelectorAll<HTMLElement>('[data-format]')];
  if (!form || !input || !result || !empty || !cards.length) return () => {};
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const texts = cards.map((card) => card.textContent ?? '');
  const groups = [...root.querySelectorAll<HTMLElement>('[data-format-group]')];

  const render = () => {
    const kept = new Set(matching(texts, input.value));
    cards.forEach((card, at) => (card.hidden = !kept.has(at)));
    for (const group of groups) group.hidden = !group.querySelector('[data-format]:not([hidden])');
    empty.hidden = kept.size > 0;
    result.textContent = `${kept.size} of ${cards.length} shown`;
  };

  form.hidden = false;
  form.addEventListener('submit', (event) => event.preventDefault(), options);
  input.addEventListener('input', render, options);
  render();
  return () => {
    controller.abort();
    input.value = '';
    render();
    form.hidden = true;
  };
}
