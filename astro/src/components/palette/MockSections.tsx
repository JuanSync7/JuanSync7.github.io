/** Below the fold of the sample landing page: three feature cards, the latest posts, an article
 *  read on the page (headings, a highlight, a quote, a comment, code), a sign-up and a footer.
 *  Cards are the ground with a hairline edge; the accent stays on links and the one action. */

const FEATURES = [
  { title: 'Ground first', text: 'Pick the page before anything on it: about sixty percent of every screen.' },
  { title: 'Ink for structure', text: 'Words, rules and icons share one ink, stepped for headings and captions.' },
  { title: 'Accent last', text: 'One colour for the next action, a focus ring and a highlight. Nothing else.' },
];

const POSTS = [
  { date: '24 Nov', tag: 'colour', title: 'Why the accent stays small', read: '6 min' },
  { date: '12 Nov', tag: 'type', title: 'Five faces that read well at sixteen pixels', read: '4 min' },
  { date: '30 Oct', tag: 'contrast', title: 'Dark mode is not the light theme inverted', read: '8 min' },
];

export default function MockSections() {
  return (
    <>
      <section className="mk-section" aria-labelledby="mk-features">
        <span className="mk-kicker">{'// 0x02 · how it works'}</span>
        <h2 id="mk-features">Three colours, three jobs.</h2>
        <div className="mk-cards">
          {FEATURES.map((f, i) => (
            <article key={f.title} className="mk-card">
              <span className="mk-card-dot" data-share={i} aria-hidden="true" />
              <h3>{f.title}</h3>
              <p>{f.text}</p>
              <a href="#mk-notes">Read the note</a>
            </article>
          ))}
        </div>
      </section>

      <section className="mk-section" aria-labelledby="mk-notes">
        <span className="mk-kicker">{'// 0x03 · from the notes'}</span>
        <h2 id="mk-notes">Latest writing</h2>
        <ul className="mk-posts">
          {POSTS.map((p) => (
            <li key={p.title}>
              <time>{p.date}</time>
              <span className="mk-badge">{p.tag}</span>
              <a href="#mk-article">{p.title}</a>
              <span className="mk-muted">{p.read}</span>
            </li>
          ))}
        </ul>
      </section>

      <article className="mk-section mk-prose" id="mk-article" aria-labelledby="mk-article-title">
        <span className="mk-kicker">{'// essay · 6 min read'}</span>
        <h2 id="mk-article-title">Why the accent stays small</h2>
        <p>
          An accent only reads as an accent when it is rare. Spend it on the <a href="#mk-about">next action</a>, a
          focus ring, <mark>one highlighted phrase</mark>, and stop there.
        </p>
        <h3>Where the other ninety percent goes</h3>
        <p>
          The ground carries the page, cards and panels. The ink carries every word and line, stepped: the darkest for
          headings, the body a little softer, captions softer again but still easy to read.
        </p>
        <blockquote>Colour is information. When everything is loud, nothing is.</blockquote>
        <p className="mk-muted">{'// a comment: quieter than the body, still 4.5:1'}</p>
        <pre className="mk-code">
          <code>{':root {\n  --ground: …;  /* 60 */\n  --ink: …;     /* 30 */\n  --accent: …;  /* 10 */\n}'}</code>
        </pre>
      </article>

      <section className="mk-section mk-signup" aria-labelledby="mk-signup">
        <h2 id="mk-signup">One letter a month.</h2>
        <p>New notes and the odd drawing. No noise.</p>
        <form className="mk-form" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="you@example.com" aria-label="Email address" />
          <button type="submit" className="mk-btn mk-btn-primary">
            Subscribe
          </button>
        </form>
      </section>

      <footer className="mk-footer" id="mk-about">
        <div>
          <span className="mk-logo">northlight</span>
          <p className="mk-muted">A sample site, painted by the palette studio.</p>
        </div>
        <nav aria-label="Sample footer">
          <a href="#mk-work">Work</a>
          <a href="#mk-notes">Notes</a>
          <a href="#mk-about">About</a>
        </nav>
        <span className="mk-badge">new</span>
      </footer>
    </>
  );
}
