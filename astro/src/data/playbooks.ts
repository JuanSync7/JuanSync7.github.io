import list from './playbooks.json';

/** One card of the register of agents and playbooks: the only part of a playbook the site shows. The
 *  experience vault owns the cards; `npm run playbooks:sync` writes playbooks.json and nothing here edits it. */
export interface PlaybookCard {
  id: string;
  kind: string;
  title: string;
  description: string;
  detail: string;
}

export const PLAYBOOKS_HREF = '/playbooks/';

export const PLAYBOOK_KINDS = [
  { id: 'agent', label: 'Agents', note: 'One domain of work with its own standing rules. An agent calls playbooks.' },
  { id: 'playbook', label: 'Playbooks', note: 'How one kind of work is done, loaded only when that work is called.' },
] as const;

export const PLAYBOOKS: readonly PlaybookCard[] = list.playbooks;

// The page groups cards by kind, so a card of a kind it has no group for would vanish without a word.
const grouped: readonly string[] = PLAYBOOK_KINDS.map((kind) => kind.id);
const stray = PLAYBOOKS.find((card) => !grouped.includes(card.kind));
if (stray) throw new Error(`playbooks.json: "${stray.id}" has a kind the register has no group for`);
