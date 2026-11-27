import { marks, type Hit } from '../../lib/site-index/search';

/** One result: the page's name with the typed words marked, its address, and the part of the site it is in.
 *  Built from text nodes only, so nothing in a title is read as markup. */
function row(hit: Hit, query: string, at: number): HTMLLIElement {
  const li = document.createElement('li');
  li.id = `ss-option-${at}`;
  li.className = 'ss-option';
  li.setAttribute('role', 'option');
  li.setAttribute('aria-selected', 'false');

  const link = document.createElement('a');
  link.href = hit.entry.path;
  link.tabIndex = -1;
  link.className = 'ss-link';

  const name = document.createElement('span');
  name.className = 'ss-name';
  for (const [text, marked] of marks(hit.entry.label, query)) {
    if (!marked) name.append(text);
    else {
      const mark = document.createElement('mark');
      mark.textContent = text;
      name.append(mark);
    }
  }
  const path = document.createElement('span');
  path.className = 'ss-path';
  path.textContent = hit.entry.path;
  const section = document.createElement('span');
  section.className = 'ss-section';
  section.textContent = hit.section;
  link.append(name, path, section);

  // When the name does not hold what was typed, the description that does is shown, so a result says why.
  const named = marks(hit.entry.label, query).some(([, marked]) => marked);
  if (query.trim() && !named && hit.entry.description) {
    const note = document.createElement('span');
    note.className = 'ss-note';
    note.textContent = hit.entry.description;
    link.append(note);
  }
  li.append(link);
  return li;
}

/** Replaces the list with these hits and says how many there are. */
export function renderHits(list: HTMLElement, status: HTMLElement, hits: Hit[], query: string): void {
  list.replaceChildren(...hits.map((hit, at) => row(hit, query, at)));
  list.toggleAttribute('data-browse', !query.trim());
  if (!query.trim()) status.textContent = 'Where to go';
  else if (!hits.length) status.textContent = 'No page has all of those words. Try fewer of them.';
  else status.textContent = `${hits.length === 1 ? '1 page' : `${hits.length} pages`} found`;
}

/** Moves the highlight to the option at `at` (wrapping) and returns it; none when the list is empty. */
export function select(list: HTMLElement, input: HTMLInputElement, at: number): HTMLElement | undefined {
  const options = [...list.querySelectorAll<HTMLElement>('[role="option"]')];
  if (!options.length) {
    input.removeAttribute('aria-activedescendant');
    return undefined;
  }
  const next = ((at % options.length) + options.length) % options.length;
  options.forEach((o, i) => o.setAttribute('aria-selected', String(i === next)));
  const chosen = options[next];
  if (chosen) {
    input.setAttribute('aria-activedescendant', chosen.id);
    chosen.scrollIntoView({ block: 'nearest' });
  }
  return chosen;
}
