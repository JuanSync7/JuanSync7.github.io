/** The reading faces nearly every site is set in. Each is a stack that needs no download:
 *  the system's own interface face, the two classic sans, the two classic serifs, and the
 *  site's own face (already loaded here) for comparison. */
export interface Face {
  id: string;
  label: string;
  stack: string;
  note: string;
}

export const FACES: Face[] = [
  {
    id: 'system',
    label: 'System UI',
    stack: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    note: 'San Francisco, Segoe or Roboto: what the reader’s device already uses.',
  },
  { id: 'helvetica', label: 'Helvetica / Arial', stack: "'Helvetica Neue', Helvetica, Arial, sans-serif", note: 'The neutral sans.' },
  { id: 'verdana', label: 'Verdana', stack: 'Verdana, Geneva, Tahoma, sans-serif', note: 'Wide and open, made for small screen text.' },
  { id: 'georgia', label: 'Georgia', stack: "Georgia, 'Times New Roman', serif", note: 'A serif drawn for screens; good for long reads.' },
  { id: 'times', label: 'Times New Roman', stack: "'Times New Roman', Times, serif", note: 'The print classic; tight on screen.' },
  { id: 'manrope', label: 'Manrope (this site)', stack: "'Manrope Variable', 'Manrope', system-ui, sans-serif", note: 'The face juansync.dev reads in.' },
];

export const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

export function face(id: string): Face {
  return FACES.find((f) => f.id === id) ?? (FACES[0] as Face);
}
