/** The repos section of the home page: what the system is made of. */

export interface Repo {
  name: string;
  kind: string;
  visibility: 'public' | 'private';
  url?: string;
  body: readonly string[];
  stack?: string;
  facts?: readonly { label: string; value: string }[];
  flagship?: boolean;
}

export const REPOS = {
  label: '// 0x04 · the repos',
  title: 'What the system is made of.',
  profile: { label: 'github.com/JuanSync7', href: 'https://github.com/JuanSync7' },
  items: [
    {
      name: 'Project Jarvis',
      kind: 'flagship',
      visibility: 'private',
      flagship: true,
      body: [
        'The agentic ledger that grounds a chip project in real tasks. A customer’s sentence becomes goals, requirements and tasks; each task gets its own workspace, and agents do the work with the existing EDA tools.',
        'Every output is tied to its inputs by fingerprint, so a changed requirement or file re-checks everything built on it. Projects start from a template with lessons from past ones built in, and managers, engineers and agents all read the same ledger.',
      ],
      facts: [
        { label: 'intent', value: 'customer sentence → GDS' },
        { label: 'unit of work', value: 'one node, one workspace' },
        { label: 'agent runs', value: '2,200+ review sessions' },
        { label: 'tests', value: '3,800+' },
        { label: 'built on', value: 'project-keel' },
      ],
    },
    {
      name: 'claude-code-linux-setup',
      kind: 'governance',
      visibility: 'public',
      url: 'https://github.com/JuanSync7/claude-code-linux-setup',
      body: ['Claude Code for a shared Linux engineering fleet, run by IT: a policy users can’t override, hooks that block secrets and log every action per person, a check-first installer, and daily, drift and weekly reports.'],
      stack: 'Bash · Python · systemd',
    },
    {
      name: 'bedrock-platform',
      kind: 'platform',
      visibility: 'private',
      body: ['The company’s Bedrock setup as code: the model registry, an IAM guardrail with tagged profiles and budgets, a LiteLLM gateway with keys for AgentCore and LangGraph agents, and a switch that runs Claude Code on Bedrock.'],
      stack: 'Python · LiteLLM · AWS',
    },
    {
      name: 'experience-vault',
      kind: 'knowledge',
      visibility: 'private',
      body: ['How lessons travel between my projects. Claude sessions and design docs become a linked Obsidian vault; lessons become rule decks, and the decks ship as skills that agents in every other repo load.'],
      stack: 'Python · Obsidian · Claude Code',
    },
    {
      name: 'doc2md',
      kind: 'ingest',
      visibility: 'public',
      url: 'https://github.com/JuanSync7/doc2md',
      body: ['Turns Office documents into token-efficient Markdown for RAG, with a second pass that proves nothing was lost: docx, xlsx and pptx must reach full token recall, and PDFs report exactly what they dropped.'],
      stack: 'Python · docling · OOXML',
    },
    {
      name: 'project-keel',
      kind: 'template',
      visibility: 'public',
      url: 'https://github.com/JuanSync7/project-keel',
      body: ['The skeleton my repos start from, Jarvis and bedrock-platform included. One labelled layout that humans and coding agents share, with gates that fail the build when structure, docs or links drift.'],
      stack: 'copier · Python · CI',
    },
    {
      name: 'Custodex',
      kind: 'quality',
      visibility: 'public',
      url: 'https://github.com/JuanSync7/custodex',
      body: ['Watches for documentation drifting from code, asks a pluggable LLM backend to fix or invalidate it, and logs every verdict for human review against a versioned public schema.'],
      stack: 'Python · LangGraph · FastAPI',
    },
  ] satisfies readonly Repo[],
} as const;
