import { useEffect, useRef, useState } from 'react';
import { EXAMPLE_NOTES, graphNeighbors, rankNotes } from '../../data/vault-demo';
import './vault-search-demo.css';

const PRESETS = ['retry policy', 'duplicate work', 'service signals'];

export default function VaultSearchDemo() {
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState(PRESETS[0]);
  const [query, setQuery] = useState(PRESETS[0]);
  const [selectedId, setSelectedId] = useState('retries');
  const [route, setRoute] = useState<readonly string[]>(['retries']);
  const selectedHeading = useRef<HTMLHeadingElement>(null);
  const pendingFollowFocus = useRef(false);
  useEffect(() => { setReady(true); }, []);
  useEffect(() => {
    if (!pendingFollowFocus.current) return;
    pendingFollowFocus.current = false;
    selectedHeading.current?.focus();
  }, [selectedId]);
  const results = rankNotes(query);
  const selected = EXAMPLE_NOTES.find((note) => note.id === selectedId);
  const neighbors = graphNeighbors(selectedId);
  const search = (text: string): void => {
    pendingFollowFocus.current = false;
    setDraft(text);
    setQuery(text);
    const first = rankNotes(text)[0];
    setSelectedId(first?.note.id ?? '');
    setRoute(first ? [first.note.id] : []);
  };
  const open = (id: string, follow = false): void => {
    pendingFollowFocus.current = follow;
    setSelectedId(id);
    setRoute((previous) => follow ? [...previous.slice(-3), id] : [id]);
  };
  return (
    <div className="vault-search-demo" id="vault-search-example">
      <p className="vsd-boundary">Synthetic example · no private vault connection</p>
      <p className="vsd-intro">Try a phrase, choose a match, then follow its groups or evidence. Every note here was made up for this page.</p>
      <form className="vsd-form" action="#vault-search-example" onSubmit={(event) => { event.preventDefault(); search(draft); }}>
        <label htmlFor="vault-example-query">Find something in the example graph</label>
        <div className="vsd-query-row">
          <input id="vault-example-query" name="example-query" value={draft} maxLength={160}
            onChange={(event) => setDraft(event.target.value)} disabled={!ready} autoComplete="off" />
          <button type="submit" disabled={!ready}>Find notes</button>
        </div>
      </form>
      <div className="vsd-presets" aria-label="Example queries">
        {PRESETS.map((preset) => <button key={preset} type="button" disabled={!ready}
          aria-pressed={query === preset} onClick={() => search(preset)}>{preset}</button>)}
      </div>
      <noscript><p className="vsd-status">This saved example is readable without JavaScript. Enable JavaScript to change the query or follow a link.</p></noscript>
      <div className="vsd-grid">
        <section className="vsd-results" aria-label="Example search results">
          <p className="vsd-label">01 · find an entry point</p>
          <p className="vsd-status" role="status" aria-live="polite">{results.length} matching example {results.length === 1 ? 'note' : 'notes'}</p>
          {results.length ? <ol>{results.map(({ note, reasons }) => <li key={note.id}>
            <button type="button" className="vsd-result" disabled={!ready}
              aria-pressed={selectedId === note.id} onClick={() => open(note.id)}>
              <span className="vsd-kind">{note.kind}</span>
              <strong>{note.title}</strong>
              <span>{note.summary}</span>
              <span className="vsd-match">Matched {reasons.join(' · ')}</span>
            </button>
          </li>)}</ol> : <p className="vsd-empty">{query.trim() ? 'No example note matches those words. Try “retry policy” or another phrase above.' : 'Enter a few words to find an entry point.'}</p>}
        </section>
        <section className="vsd-context" aria-label="Selected example note and its links">
          <p className="vsd-label">02 · follow the connections</p>
          {selected ? <>
            <h3 ref={selectedHeading} tabIndex={-1}>{selected.title}</h3>
            <p>{selected.summary}</p>
            <p className="vsd-trust">{selected.trust} · a label in this fictional dataset</p>
            <p className="vsd-label">One-hop links</p>
            <ul className="vsd-neighbors">{neighbors.map((neighbor) => <li key={`${neighbor.from}/${neighbor.relation}/${neighbor.to}`}>
              <button type="button" disabled={!ready} onClick={() => open(neighbor.note.id, true)}>
                <span className="vsd-direction">{neighbor.direction} · {neighbor.relation}</span>
                <strong>{neighbor.note.title}</strong>
                <span>{neighbor.direction === 'outgoing' ? 'This note → linked note' : 'Linked note → this note'}</span>
              </button>
            </li>)}</ul>
            {!neighbors.length ? <p>No declared links from or to this example note.</p> : null}
            <p className="vsd-route-label">Recent route</p>
            <ol className="vsd-route" aria-label="Recent navigation route">{route.map((id, index) =>
              <li key={`${index}/${id}`}>{EXAMPLE_NOTES.find((note) => note.id === id)?.title ?? id}</li>)}</ol>
          </> : <p className="vsd-empty">Choose a matching note to inspect its declared connections.</p>}
        </section>
      </div>
      <p className="vsd-footnote">Search ranks words in titles, aliases and summaries. Links then open broader groups, related topics or evidence. This small demonstration runs entirely in your browser and produces no generated answer.</p>
    </div>
  );
}
