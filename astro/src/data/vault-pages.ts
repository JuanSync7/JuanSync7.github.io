/** Public reading routes. Keep the introduction short; each guide owns its deeper explanation. */
export const VAULT_GUIDES = [
  {
    slug: 'purpose',
    title: 'Why the vault exists',
    summary: 'The problem, the purpose and the principles behind keeping a useful record of experience.',
    kicker: 'The thinking',
  },
  {
    slug: 'architecture',
    title: 'The architecture',
    summary: 'How sources become connected records, and which systems keep the process repeatable.',
    kicker: 'The system',
  },
  {
    slug: 'knowledge-graph',
    title: 'The knowledge graph',
    summary: 'Pages, identities and named relationships, with a hierarchy that can be entered from any page.',
    kicker: 'The connections',
  },
  {
    slug: 'search',
    title: 'How search works',
    summary: 'Find a useful entry point, follow its connections and inspect the evidence behind it.',
    kicker: 'The retrieval',
  },
  {
    slug: 'guardrails',
    title: 'Rules and guardrails',
    summary: 'Metadata, ownership, source trust and the checks that keep automation inspectable.',
    kicker: 'The contracts',
  },
] as const;

export type VaultGuideSlug = (typeof VAULT_GUIDES)[number]['slug'];
