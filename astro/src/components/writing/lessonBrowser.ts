import taxonomy from '../../config/lesson-taxonomy.json';

interface LessonNode {
  node: HTMLElement;
  category: string;
  tags: string[];
  date: string;
}

export function mountLessonBrowser(root: HTMLElement): () => void {
  const form = root.querySelector<HTMLFormElement>('[data-lesson-controls]');
  const groups = root.querySelector<HTMLElement>('[data-lesson-groups]');
  const result = root.querySelector<HTMLElement>('[data-lesson-result]');
  const empty = root.querySelector<HTMLElement>('[data-lesson-empty]');
  const selected = root.querySelector<HTMLElement>('[data-tag-selected]');
  const category = form?.querySelector<HTMLSelectElement>('[name="category"]');
  const view = form?.querySelector<HTMLSelectElement>('[name="view"]');
  const search = form?.querySelector<HTMLInputElement>('[name="tag-search"]');
  if (!form || !groups || !result || !empty || !selected || !category || !view || !search) return () => {};
  const controller = new AbortController();
  const routeState: unknown = window.history.state;
  const routeIndex = routeState && typeof routeState === 'object' && 'index' in routeState ? routeState.index : undefined;
  const options = { signal: controller.signal };
  const pathname = window.location.pathname;
  const checkboxes = [...form.querySelectorAll<HTMLInputElement>('[name="tag"]')];
  const lessons: LessonNode[] = [...root.querySelectorAll<HTMLElement>('[data-lesson]')].map((node) => ({
    node, category: node.dataset.category ?? '', tags: (node.dataset.tags ?? '').split(' '), date: node.dataset.date ?? '',
  })).sort((a, b) => b.date.localeCompare(a.date) || a.node.id.localeCompare(b.node.id));
  const month = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  const render = () => {
    const tags = checkboxes.filter((box) => box.checked).map((box) => box.value);
    const matching = lessons.filter((lesson) => (!category.value || lesson.category === category.value)
      && tags.every((tag) => lesson.tags.includes(tag)));
    const grouped = new Map<string, LessonNode[]>();
    if (view.value === 'category') {
      for (const item of taxonomy.categories) {
        const items = matching.filter((lesson) => lesson.category === item.id);
        if (items.length) grouped.set(item.label, items);
      }
    } else {
      for (const lesson of matching) {
        const label = month.format(new Date(`${lesson.date}T00:00:00Z`));
        const items = grouped.get(label) ?? [];
        items.push(lesson);
        grouped.set(label, items);
      }
    }
    const fragment = document.createDocumentFragment();
    for (const [label, items] of grouped) {
      const section = document.createElement('section');
      section.className = 'lesson-group';
      section.dataset.lessonGroup = '';
      section.setAttribute('aria-label', label);
      const header = document.createElement('header');
      const heading = document.createElement('h2');
      heading.textContent = label;
      const count = document.createElement('p');
      count.textContent = `${items.length} ${items.length === 1 ? 'lesson' : 'lessons'}`;
      header.append(heading, count);
      const list = document.createElement('ol');
      list.className = 'lesson-items';
      for (const lesson of items) list.append(lesson.node);
      section.append(header, list);
      fragment.append(section);
    }
    groups.replaceChildren(fragment);
    empty.hidden = matching.length > 0;
    selected.textContent = tags.length ? `(${tags.length} selected)` : '';
    result.textContent = `${matching.length} of ${lessons.length} lessons · grouped by ${view.value} · newest first${view.value === 'category' ? ' in each category' : ''}`;
  };

  const readUrl = () => {
    const params = new URL(window.location.href).searchParams;
    view.value = params.get('view') === 'date' ? 'date' : 'category';
    const requested = params.get('category') ?? '';
    category.value = [...category.options].some((option) => option.value === requested) ? requested : '';
    const tags = new Set(params.getAll('tag'));
    for (const box of checkboxes) box.checked = tags.has(box.value);
    render();
  };

  const updateUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.delete('category');
    url.searchParams.delete('tag');
    if (view.value === 'date') url.searchParams.set('view', 'date');
    if (category.value) url.searchParams.set('category', category.value);
    for (const box of checkboxes) if (box.checked) url.searchParams.append('tag', box.value);
    // Keep Astro's route index intact: filter entries belong to this page, not its router.
    if (url.href !== window.location.href) window.history.pushState(window.history.state, '', url);
    render();
  };

  const filterTags = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    for (const option of form.querySelectorAll<HTMLElement>('[data-tag-option]')) {
      option.hidden = !(option.dataset.tagLabel ?? '').includes(query);
      if (!option.hidden) count++;
    }
    for (const fieldset of form.querySelectorAll<HTMLFieldSetElement>('[data-tag-type]')) {
      fieldset.hidden = ![...fieldset.querySelectorAll<HTMLElement>('[data-tag-option]')].some((option) => !option.hidden);
    }
    const noTags = form.querySelector<HTMLElement>('[data-tag-search-empty]');
    if (noTags) noTags.hidden = count > 0;
  };

  form.addEventListener('submit', (event) => event.preventDefault(), options);
  form.addEventListener('change', updateUrl, options);
  form.addEventListener('reset', (event) => {
    event.preventDefault();
    category.value = '';
    for (const box of checkboxes) box.checked = false;
    search.value = '';
    filterTags();
    updateUrl();
  }, options);
  search.addEventListener('input', filterTags, options);
  window.addEventListener('popstate', (event) => {
    if (window.location.pathname !== pathname) return;
    const state: unknown = event.state;
    const index = state && typeof state === 'object' && 'index' in state ? state.index : undefined;
    if (index !== routeIndex) return;
    event.stopImmediatePropagation();
    readUrl();
  }, { ...options, capture: true });
  readUrl();
  form.hidden = false;
  return () => controller.abort();
}
