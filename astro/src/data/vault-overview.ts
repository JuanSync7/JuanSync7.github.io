/** Curated public descriptions. This module never imports the private vault or its generated indexes. */
export const VAULT_AREAS = [
  {
    name: 'My notes',
    kind: 'Authored',
    text: 'What I write, correct or explicitly adopt: context, ideas and accounts of what I know. A generated page cannot silently turn its interpretation into my view.',
  },
  {
    name: 'Projects and work',
    kind: 'Generated record',
    text: 'What was built, the decisions along the way, alternatives, outcomes and the work that remains. Each account keeps a route back to its sources.',
  },
  {
    name: 'The wiki',
    kind: 'Connected knowledge',
    text: 'Tools, methods and ideas encountered across projects. A topic can connect to several projects and lessons while keeping stated and inferred views distinct.',
  },
  {
    name: 'Groups and themes',
    kind: 'Navigation',
    text: 'Grouping pages collect related material and can nest under broader themes. Maintained groups are separate from communities proposed by graph analysis.',
  },
  {
    name: 'Lessons and rules',
    kind: 'Reusable guidance',
    text: 'Lessons carry the case that taught them. Rules explain the behavior to follow, why it exists and which check or review can hold it.',
  },
  {
    name: 'Evidence and time',
    kind: 'Source trail',
    text: 'Work notes, experiments and a timeline preserve the context behind a claim. A short summary is a way in; the underlying account is still available to inspect.',
  },
  {
    name: 'Review and operations',
    kind: 'Maintenance',
    text: 'Queues, schemas, checks, component maps and change records make missing information and unfinished work visible instead of smoothing them away.',
  },
  {
    name: 'Public writing',
    kind: 'Separate output',
    text: 'Selected, reviewed explanations can become articles or lessons. This page is a curated system description; the private graph and its records stay outside this website.',
  },
] as const;

export const VAULT_SYSTEMS = [
  {
    title: 'Capture the account',
    scope: 'Sources',
    modules: [
      ['Chat collection', 'Collect the relevant working conversations from supported sources.'],
      ['Repository intake', 'Bring selected documentation and change context into the source record.'],
      ['Source caches', 'Keep reusable input separate from the pages rendered from it.'],
      [
        'Manual capture and interviews',
        'Add knowledge that never appeared in a chat, with the owner reviewing the account.',
      ],
    ],
  },
  {
    title: 'Build useful records',
    scope: 'Processing',
    modules: [
      ['Summarization', 'Extract work, decisions and lessons through bounded model calls.'],
      ['Cache and spend controls', 'Reuse unchanged results and bound the cost of a run.'],
      ['Page producers', 'Render consistent project, work, wiki and timeline pages.'],
      ['Authored context', 'Keep personal notes and approved guidance under a different ownership contract.'],
    ],
  },
  {
    title: 'Connect the knowledge',
    scope: 'Organization',
    modules: [
      ['Versioned metadata', 'Declare page type, schema, summary, known aliases and relevant labels.'],
      ['Identity and resolution', 'Resolve exact names and aliases to canonical pages; preserve ambiguity for review.'],
      ['Typed links and grouping pages', 'Represent navigation, membership and supported semantic relationships.'],
      ['Theme discovery', 'Propose graph communities with stable identities; adoption remains a separate decision.'],
    ],
  },
  {
    title: 'Find and use context',
    scope: 'Retrieval',
    modules: [
      ['Lexical search', 'Rank terms across titles, aliases, summaries and note bodies.'],
      ['Graph navigation', 'Move through groups, parents, neighbors and backlinks.'],
      ['Task briefings', 'Select bounded context for a task and retain the exact versions used.'],
      ['Agent instructions', 'Apply the relevant rules to a task while preserving source and trust labels.'],
    ],
  },
  {
    title: 'Keep the boundaries clear',
    scope: 'Governance',
    modules: [
      ['Writing and code rules', 'Keep documents, code, diagrams and agent workflows consistent.'],
      ['Integrity checks', 'Check schemas, links, identities, ownership and generated-output freshness.'],
      ['Privacy screening', 'Screen names and secrets, hold uncleared files and check outgoing versions.'],
      [
        'Public release review',
        'Apply a separate public-content boundary before selected material leaves the private system.',
      ],
    ],
  },
  {
    title: 'Make the next run ordinary',
    scope: 'Operations',
    modules: [
      ['Bounded rebuilds', 'Regenerate dependent views until checks agree, or stop within a fixed limit.'],
      ['Review queues', 'Keep uncertain references, proposed changes and missing information visible.'],
      ['Evaluation and CI', 'Exercise retrieval tasks and failure cases instead of treating a green render as proof.'],
      [
        'Component inventory',
        'Record components, interfaces, dependencies, tests and gaps; derive overview diagrams from maintained data.',
      ],
    ],
  },
] as const;

export const VAULT_CHECKS = [
  ['Shape', 'A page follows its declared schema; changed pages use the current version.'],
  ['Identity', 'Aliases and renames resolve explicitly. Similar names are not enough to merge two subjects.'],
  ['Links', 'Destinations exist, ambiguity is visible and structural parent paths stay acyclic.'],
  ['Ownership', 'A producer updates its own outputs; authored and protected sources retain their boundaries.'],
  ['Freshness', 'Indexes, grouping pages, reference state and diagrams agree with the current source snapshot.'],
  ['Retrieval', 'Known questions still reach useful anchors and their evidence after a change.'],
  ['Privacy', 'Configured name and secret checks screen outgoing content; public release has a separate boundary.'],
  ['Failure behavior', 'A stale, partial or over-budget operation stops or keeps permitted last-good results.'],
] as const;

export const VAULT_METADATA = `type: knowledge
schema: knowledge/3
summary: "A worked example of a bounded retry policy."
aliases: [Retry policy]
up: "[[Reliable systems]]"
authority: unreviewed
status: draft`;
