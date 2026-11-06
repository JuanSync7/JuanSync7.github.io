function initDesignSystem(): void {
  const root = document.querySelector<HTMLElement>('[data-design-system]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const status = root.querySelector<HTMLElement>('[data-copy-status]');
  let timer: ReturnType<typeof setTimeout> | undefined;
  async function copy(text: string, button: HTMLButtonElement): Promise<void> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const field = document.createElement('textarea');
        field.value = text;
        field.className = 'ds-copy-field';
        root?.append(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        button.focus();
        if (!copied) throw new Error('Clipboard unavailable');
      }
      if (status) status.textContent = 'Copied to clipboard.';
    } catch {
      if (status) status.textContent = 'Clipboard unavailable. Select the code below and copy it manually.';
      button.closest('.ds-code')?.querySelector('pre')?.focus();
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (status) status.textContent = '';
    }, 5000);
  }
  root.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('button[data-copy-code], button[data-copy-token]');
    if (!button) return;
    const text = button.dataset.copyToken ?? button.closest('.ds-terminal')?.querySelector('code')?.textContent;
    if (text) void copy(text, button);
  });
  const navLinks = root.querySelectorAll<HTMLAnchorElement>('[data-section-link]');
  const sections = root.querySelectorAll<HTMLElement>('section[data-ds-section]');
  const observer = new IntersectionObserver(
    (entries) => {
      const active = entries.find((entry) => entry.isIntersecting);
      if (!active) return;
      navLinks.forEach((link) => {
        if (link.hash === `#${active.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    },
    { rootMargin: '-15% 0px -65% 0px' },
  );
  sections.forEach((section) => observer.observe(section));
  document.addEventListener(
    'astro:before-swap',
    () => {
      observer.disconnect();
      clearTimeout(timer);
    },
    { once: true },
  );
}
initDesignSystem();
document.addEventListener('astro:page-load', initDesignSystem);
