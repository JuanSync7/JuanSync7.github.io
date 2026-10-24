---
title: "Agents you can repeat"
summary: "The agents I trust aren't the clever ones. They're the ones whose every decision a script could make has been taken away from them."
eyebrow: "Agents"
date: 2026-10-24
subject: agents
cover: "workflow~3"
featured: true
shelfNotes: ["one job walks the graph, station by station", "the lit station is the one at work"]
---

I have agents doing real work across my projects: writing code, filing notes, reviewing each other, drawing figures for my site. A lot of it is good. The trouble is the work that was good once and different the next time. In one project a question that blocked every task sat unanswered for a day; then the agent went ahead on a guess it never wrote down, and the guess was wrong. In an experiment, a rule written in the prompt was ignored in 19 of 20 runs. Agreed decisions lived in a chat and were gone when the session ended. And the agent I needed wasn't always the one called at the right time.

None of that was the model, the AI itself, being stupid. Traced back, each failure ends in the same place: a decision that lived in prose, where nothing could hold it.

A foundry, the factory that makes chips, ships a **rule deck**: thousands of geometry rules that every chip layout must pass before the factory will build it. I come from chip design, and this is the part I miss most in software. The designer never edits the deck. A program checks every layout against it, every time. A rule that can't be met needs a named person to sign a waiver. That leaves the designer's judgment for the part no deck can decide: the architecture. A judge the builder can't touch, and judgment kept for what needs it: that's the shape this article builds for agents.

It goes from the smallest piece up: one rule, the check that holds it, the kernel an agent builds with, what the front end shows about taste, the playbook that packages them, the agent that owns playbooks, the workers it hands work to, the decks a company shares, one run from start to end, and how parts are tested and promoted. Then it ties the work to a record, scales it to many people, tests each part, and ends with how someone who doesn't write code can use all of it.

## What went wrong first

First, the failures the shape answers. Toyota's engineers have a method for this: ask "why?" five times, each answer feeding the next question, until you reach a cause you can fix. Here it is on two of them, rebuilt from the records.

**Too many agents.**

```
Why did the work drift?     Each agent had part of the context and its own
                            copy of the rules.
Why its own copy?           A new topic got a new agent.
Why a new agent per topic?  Agent count is an easy number to grow, and
                            nothing said when not to.
Why did nothing say?        There was no test for "this needs a new agent".
Why no test?                A topic has no edge a program can check.
Root: split agents at an edge you can check (what it may do, what data it
      reads, who owns it), never by topic.
```

What I said back then still holds: "quality is not the number of agents but the playbooks in an agent and how its rules are defined".

**The right agent wasn't called.** An agent picks which of its procedures to use from a one-line description of each.

```
Why wasn't the procedure used?  The agent picked a different one, or none.
Why?                            It chose from the one-line descriptions.
Why did the description fail?   Too broad, and the agent read it as a summary
                                and skipped the steps; too narrow or vague,
                                and it never matched.
Why was it written like that?   It was written to describe the procedure,
                                not to be matched against.
Why?                            Nobody treated the description as the
                                trigger it is.
Root: a description says only when to use it ("Use when ..."), and fixed
      events (a saved change, a schedule, a request for review) start an
      agent through a hook, a script the tools run at that event, not
      through the agent's judgment.
```

Others followed shorter chains to the same kind of root:

| What went wrong | What happened | What answers it |
|---|---|---|
| An agent guessed | A blocking question sat for a day; then the agent acted on a guess it never wrote down, and it was wrong | A written list of when to stop and ask, and every guess recorded with what it would cost if wrong |
| An agent forgot | About 17 agreed items had no row in the project's records; they lived in a note in a temporary folder, in agent memory or in the chat | A fixed place in files for what an agent learns, and every decision written as a work item |
| A rule in the prompt didn't hold | 19 of 20 runs still kept a setting the rules forbade | A check: a script that decides the rule every time |
| A report trusted the wrong signal | A run was reported as passed because the command printed the code; the real exit code was 1 | Results read from the real exit code, never from printed text |

Each answer is the same move: take a decision out of prose and give it to something that can hold it. The smallest thing you can move is one rule, so that's where the shape starts.

## One rule, written so it can leave

A **rule** is one line of guidance with its reasons attached: an id, the rule, why it exists, the case that created it, and how sure we are of it. A real one, from my rules for building agents:

| id | Rule | Why | Case that created it | Evidence | Could a script check it? |
|---|---|---|---|---|---|
| R-AGT-30 | Read a run's result from its output file and its real exit code, never from the task status or from text the command echoed. | The status says the wrapper finished, not that the work passed. | A background run was reported as a success because the command echoed the code; the real exit was 1. | adopted | yes: the runner records the exit code in a typed record |

Two columns do the work. **Case** ties the rule to a real failure, so the list grows only as fast as real failures do, and a rule can be retired once its case passes without it. **Evidence** says whether I've confirmed it (`stated`, `adopted`) or it's still on trial (`observed x1`, then `observed x2` once a second project reports it). A trial rule is followed, and reported when it doesn't fit.

The last column matters most. "Could a script check it?" is asked of every rule, and when the answer is yes, the rule's job is to leave the list and become the next piece.

## The check: a rule a script decides

A **check** is code that judges output: same input, same verdict, no model call. A rule in a prompt is a request; a check is a fact. My rule experiments measured both sides. On a small task, no rules scored 7.8 of 10 checks passed, 13 rules 9.1 and 30 rules 9.0, so rules in the prompt do help. But one rule hardly held at all: 19 of 20 runs still kept a setting written into the code as a backup, which the rules forbade. A check catches that every time, without a model call.

Checks come from failures, not from what looks correct:

1. Something goes wrong.
2. It becomes a rule, with the case that caused it.
3. Ask: can a script decide this?
4. Write the check, then prove it two ways: it fails on the bad case, and it passes on the good examples.

The first proof keeps the check honest; the second keeps it from crying wolf. A check never seen failing is a guess dressed as a guard. I found one recently. The test for my name detector (a model that finds personal names before anything is shared) printed a score of zero when it couldn't reach the model at all. It had judged nothing, but zero reads as "judged everything and found nothing". The fix is filed: when the test can't run, it says so, with its own exit code.

```
$ pii_eval.py                     # every model call refused (shortened)
pii eval: FAIL  recall 0.000      ← today: a score of zero
pii eval: could not run           ← the fix: unknown, not zero
```

Back to the foundry, because the hardest idea in the shape is here: **the builder never edits the judge**. The foundry's rule deck maps to the checks. A designer whose layout breaks a spacing rule doesn't get to widen the rule; they move the wires. If they could edit the deck, each rule would loosen exactly as far as their layout needed, and the deck would stop meaning anything. An agent that can edit a check is rewarded for loosening it in the same way. So checks belong in their own folder that the agent may not touch. Today that's an instruction: the playbook I learned it from forbids editing, and the hook that would block the edit isn't built yet. The waiver maps back too. When a check can't be met, the agent doesn't work round it. It records the case and a person signs off.

The check judges. The agent still needs something to build with.

## The kernel: what the agent builds with

A **kernel** is code the agent builds with: functions that turn a decision into output. Like a check, it gives the same result for the same input every time; the word for that is *deterministic*. What separates them is direction: the kernel builds, the check judges, and a review by a fresh reader answers what neither can decide.

Two habits make a kernel cheap for an agent to use. The first is a one-screen index at the top: every function on one line, its traps written where they bite, and the instruction "read this index; do not read the code under it". The agent learns everything it can call in a couple of thousand tokens (the units a model reads, and is billed by) instead of reading the source. Two lines from one such index:

```
fit(C, points, cx, cy)   centres the box of [x, y, z] points on (cx, cy);
                         call it once, before proj
                         it only centres, it never scales: choose S by trying values
fillet(points, radii, n) rounds every vertex of a closed polygon
                         radii is an array, one per vertex;
                         a single number gives NaN.
```

"A single number gives NaN" (not a number) is a past mistake, recorded where the next agent would make it again.

The second habit: every piece of output depends only on its inputs and a seed, a number that fixes any randomness in advance. No reading the clock, no randomness without a seed. Then pieces can run in any order, in parallel and again, and come out identical. That's what makes the work repeatable rather than merely similar.

Both habits come from the front end, the part of software people see, which is the best place to watch rules and kernels turn into something that looks like taste.

## Where taste comes from: the front-end case

Drawing good figures looks like the last thing you could hand to rules. Yet the best agent-drawn figures I've seen came from a stack of them.

Hairline, an open-source figure playbook that someone else wrote (MIT-licensed, not mine), is built like this, as Claude read it for me. Its kernel is a 24 KB file with that 80-line index on top. Its checks, a validate script and a look script, are separate files the agent is told not to edit, and the look script runs on every figure and every revision. Its craft list, the rules that need judgment, is held to ten. Its examples set the bar in numbers: "the examples cover 36%" of the frame, and a new figure is measured against that. And it has a table that fires at the moment of temptation, written the way the agent would think it:

| If you catch yourself | Do this instead |
|---|---|
| reaching for a colour, a fill or a glow | move one stroke from `sil` to `hi` (rule 04) |
| editing the kernel or the bench to make something work | the figure is wrong; change the figure |
| letting in a second idea | cut it: one figure, one idea |

My own site works the same way. Its `figure` skill holds thirteen rules (palette, signal, clock, width, length and the rest), and `npm run figures:audit` checks every figure against them. Each template picks its motif by meaning and is seeded, so the same page always draws the same figure.

Now the honest part. The model doesn't have taste, and none of this gives it any. Taste is knowing which option is right before you can say why, and it comes from having seen enough good and bad. What the rules, the kernel and the examples hold is my taste, written down as far as it can be. The model runs it. The ten craft rules are the slice of taste that's still judgment, and that's where the model's attention goes. The figures look tasteful because a person's taste was turned, rule by rule, into things a script can hold.

A kernel, checks, examples and a short craft list now have to travel together. They travel as a playbook.

## The playbook: one responsibility, packaged

A **playbook** is one responsibility of an agent, packaged as a folder: what to do, the craft rules, what a reviewer should look for, and the code. It's loaded whenever that responsibility comes up, and it's kept under version control with the agent. This is the layout I've agreed on; it's not yet a built template.

```
explain-oom/                 one responsibility (an example name)
├─ SKILL.md      the steps, when to ask, how to hand over
├─ RULES.md      craft rules: judgment only
├─ LOOK.md       evidence to produce, and the questions a reviewer answers
├─ tools.md      which of the agent's tools it uses, with their traps
├─ kernel/       code it builds with
├─ checks/       code that judges; the agent may not edit it
└─ examples/     a few good and bad outputs: the quality bar
```

Three rules make a playbook behave the same way every run:

- **Its description is a trigger.** It says only when to use it ("Use when a job died for lack of memory and someone asks why"), never a summary of its steps. That's the second root cause, fixed where it starts.
- **It checks itself before it hands over.** Its steps end with a check step: run the checks, answer the judgment questions with cited evidence, and say what wasn't verified.
- **It hands over in a fixed form.** One of four statuses (done, done with concerns, blocked, needs context), the full report in a file, a reply of under fifteen lines that names the file, and what wasn't checked.

A rule that matters in one step goes in that step, not the main list. Rules that don't apply still cost attention.

One playbook is one job. Someone has to own several, remember things between runs, and be the name on the work. That's the agent.

## The agent: an identity, not a topic

An **agent** is an identity that holds playbooks. Identity means a name the system can check, with four things attached: **scope** (what it's responsible for), **memory** (what it alone writes), **permissions** (what it may do, enforced outside the model) and **accountability** (the person who owns it and authorises what it does). Today an agent has the first two; it still runs with my permissions, and records name me, not the agent.

Whether to make one is the first root cause again. Climb a ladder and stop at the lowest rung that works:

| Rung | Use it when |
|---|---|
| 1. A plain script | The steps and the answer are fixed by the data |
| 2. A fixed sequence with one model step | The steps are fixed; one step needs judgment or language |
| 3. A new playbook in an existing agent | Same owner, same data, same permissions; a new procedure |
| 4. A new agent | A new edge: what it may do, what data it reads, who owns it, who it serves |

A new topic is a playbook. A new agent needs a new edge.

The agents at rung 4 are **residents**: they persist, and an event starts them (a message, a schedule, a hook, a person). A repo agent lives in one project's code. A **shop agent**, a front-end agent say, has a job but no project; it sets up shop where it's called, brings its own playbooks and memory, and takes its context from the project it's working in, the way a contractor brings their craft and takes the brief from you.

People carry memory between days; an agent starts blank, and what isn't in a file is gone. So the agent's definition stays thin, and its memory lives in a fixed home: one place per agent, an index that's always loaded with one fact per line, and one writer, the agent itself. It opens only what the index points to for the task in hand.

A good resident spends its time choosing and judging. Doing all the work itself is how it drowns, and that's what workers are for.

## Workers and the orchestrator

A **worker** is a short-lived agent: a brief goes in, a result comes out, and it ends. It has no memory of its own and works under its parent's identity. Between the resident and its workers sits the **orchestrator**, and I first pictured it as another agent. It doesn't need to be. Starting workers, waiting, collecting, retrying and enforcing limits are fixed steps, so by the ladder they belong in a script. What to split, what to accept and what to remember stay with the resident.

```
Resident (identity, memory home, playbooks)
├─ talks to the person, judges, decides what to keep
└─ orchestrate playbook
   ├─ script: starts workers, enforces limits, collects results
   └─ workers (one brief each, no memory) → results back to the resident
```

I've run this once, with my vault agent as the resident. It gave four workers three incoming messages to file and a set of agreed rule changes. Each brief named the only files that worker could edit, so no two workers touched one file. Workers couldn't save changes to the history or edit the shared log, and they answered in a fixed form with room for "problems with my brief" and "what I didn't verify".

```
workers        4, started at once by one script
run time       215 seconds
tokens         289,186 across the workers, 62 tool calls
               (flat subscription, not billed per token)
conflicts      0: every file had one owner
brief problems 15 reported, several real
not verified   15 reported
requests       30 for files no worker owned, all left for the resident
```

The workers were fast and honest; one caught two items sharing an id that the resident had missed. The cost moved up. The resident still had to apply 30 requests for shared files, split a change into two saves by hand because workers couldn't save, and catch what no brief had asked about. One run is one case, but it already says what the orchestrate playbook needs: files owned by one worker each, shared files kept with the resident, every brief checked against the files it names before the run, each request marked "needed" or "nice to have", and the checks run before anyone reads the prose.

There's an idea here I haven't tested. If workers only get narrow tasks, the hard part moves into cutting the work into pieces, which is the resident's job and mine. If that's right, the resident needs the best context and the strictest review, and workers need the narrowest briefs.

Workers, residents and shop agents all follow some of the same rules. Those rules have to live above any one agent.

## Decks: rules the whole company shares

A **deck** is a shared set of rules for one kind of work: writing code, writing documents, building agents, drawing diagrams. It isn't the foundry's deck; that one is the checks. A deck is closer to a design team's guidelines: written by whoever owns that kind of work, loaded by every agent that does it, and emptied into checks one rule at a time. A rule lives at the level where its decision is made:

```
Company
├─ decks        shared rules for a kind of work, loaded by any agent doing it
├─ protocols    how agents deal with each other and with people:
│               handover, review, escalation
├─ toolbox      what is installed, licensed and reachable
└─ agent        rules that narrow the decks for this agent's job,
   │            and the list of tools it may call
   └─ playbook  craft rules for one responsibility
      └─ step   a rule that matters in one step only
```

Tools sit at three levels, and I've proposed that the line between them is a permission. The company has a toolbox. An agent has a list of what it may call. A playbook owns its kernel and checks and lists which of the agent's tools it uses. No deck grants a tool, and a playbook can't add one; a playbook that needs a new tool means the agent's edge is moving, and that's for its owner to decide.

Every rule in a deck also says who holds it: the writer while writing, a reviewer with fresh eyes, or a check. A rule only the writer holds is a convention until a check holds it over the whole project. My earlier framework, synapse, showed what happens otherwise: its rules lived in one place and its checks in another, they drifted, and the project failed its own checker with 114 errors, with two formats for one file header in force at once.

With rules at every level, one run can go from request to result the same way every time.

## One run, step by step

Here is one run, putting rules I already follow into one order; the order itself isn't a written playbook yet. A script holds a step when its answer is fixed, a model when it needs judgment, and a person when it's accountable or can't be undone.

| Step | What happens | Held by |
|---|---|---|
| 1. Start | A hook, schedule, message or review request starts the resident | script |
| 2. Frame | A vague ask gets five questions first (what must this prove, to whom; the one moment that has to land; what we won't do; the smallest version; how we'll know it's done), each with a predicted answer | resident, then a person confirms |
| 3. Slice | The work is cut into narrow pieces, each with a brief that names its files | resident |
| 4. Dispatch | Workers start, limits are enforced, results are collected | script |
| 5. Build | Each worker builds with the kernel, inside its own files | worker |
| 6. Check | Checks run on the output; the judgment questions are answered with cited evidence | script, then worker |
| 7. Hand over | Status, report file, short reply, what wasn't verified | worker |
| 8. Review | A fresh reader with no build context answers what the checks can't | reviewer |
| 9. Record | Conflicts and guesses are written down as what, why and cost if wrong | resident |
| 10. Accept | Anything irreversible, security-sensitive, outward-facing or over budget waits for a person | person |

Only five things stop a run to wait for a person: a step that can't be undone, a security-sensitive one, a change outside the workspace (a merge, a push, a publish), a plan so broken that every path is a guess, and spending past an approved limit. Everything else is decided, written down, and the run carries on.

That's one run made repeatable. The parts that run it still change, and each change needs the same discipline.

## Tests for the parts, and how a part moves up or down

An **eval** tests a playbook or an agent, not one piece of its output: golden tasks with fixed inputs and known answers, plus simulated users who poke at it the way a person or another model would. Evals run before a part is promoted and after every change to its prompt, its model or its tools. They follow the same rules as checks: break the playbook on purpose and the suite must fail; a suite that passes over zero tasks has failed; and the judge scores against a reference a person wrote, never the agent judging itself.

Then each part has a way up and a way down.

**A rule moves up** on evidence. A trial rule seen in one project is `observed x1`; a second project makes it `observed x2`; then I adopt or drop it. My exit-code rule was reported by two projects on the same day and I adopted it that day. **It moves down** into a check when a script can decide it. I define and prove a check in my vault first, then move it into keel, my project template, so every new project gets it; the move is a move, not a copy, so there's one version. **It leaves** when its case still passes without it. The signs a list is too long can be measured: a rule never fires in evals, two rules conflict, an agent cites a rule it didn't apply, adding a rule makes old cases fail, or a rule describes one incident rather than a pattern.

**An agent moves up** through stages, in a design for a company agent registry that isn't built yet:

| Stage | Who may use it | To move on |
|---|---|---|
| proposed | nobody | its record is valid, it has an owner, its one-line purpose is reviewed |
| sandbox | its owner only, on a copy of the data | its permissions are generated; no sensitive data |
| eval-gated | its owner and named testers | golden tasks pass over several runs; cost per task under budget; a review that tries to break it |
| production | the dispatcher may send it work | stays while spot checks on real use and its budget hold |
| retired | nobody; the record is kept | none |

Two rules keep it honest. An owner can't approve their own agent into production; a second person does. And **demotion needs no approval**: back to sandbox, or straight to retired, because stopping must be cheap.

Every move in that table is recorded somewhere: a rule's tag, a check's history, a registry entry. Across all my projects, those records live in different places, and joining them is what I'm building an agentic project management ledger for.

## Tying the work to a record

The ledger keeps one strict record per project. It holds **nodes**: one piece of work each, linked by what it depends on, with the conditions that make it green agreed before anyone starts. Each kind of node has a **doer**, which may be a person, a recipe (a fixed script) or an agent, and the doer produces the evidence. A **gate** reads that evidence: if these checks pass, the node is green. Only the ledger's own service writes to it; nothing else can.

```
node: lint gate on block X              (an illustration)
├─ conditions   agreed up front: the lint run is clean, or each waiver is signed
├─ doer         agent (earlier: a recipe; before that: a person)
├─ reporter · assignee · reviewer   the reviewer is never the assignee
├─ evidence     the lint tool's own output, cited in the ledger
└─ verdict      green only if the gate reads green from that evidence
```

This is where the agent shape pays off. An agent with an identity can be the assignee on a node. Its playbook's checks become the node's gate, and its hand-over becomes the node's evidence. The design aim is that a green can't be invented: the gate is tied to the ledger, the tools are deterministic, and the agent must cite how each condition was met. If a node goes green wrongly, the node was defined badly, and that's a fix to the node, not a hunt through a chat log. Doers move from person to recipe to agent one kind of node at a time, while the ledger's rules stay fixed, and an agent never writes "approved": a person stays the accountable gate.

Most of this isn't built. The ledger as its own git repository is being built, work cards are the record for now, and recording who acted and who authorised it on every entry is the next step.

With identity, rules and a record, the last question is what happens with many people instead of one.

## A worked example: from one person to a company

Follow one request through the design. None of it has run end to end; the closest is the single filing run above. An engineer in a firmware project asks for a status page with a figure of the boot sequence.

```
engineer A ──ask──▶ repo agent (resident, firmware project)
    ├─ frames the ask: five questions, predicted answers, A confirms
    ├─ orchestrate script ─▶ worker 1: page text   (owns page.md)
    │                      ▶ worker 2: data table  (owns data.json)
    ├─ calls shop agent: front end
    │    ├─ brings its playbooks: figure kernel, figure checks, examples
    │    ├─ takes context from the firmware project
    │    └─ hands back a figure that passed the figure audit
    ├─ ◀── results; checks; fresh review
    └─ ledger node "status page": evidence cited, reviewer is engineer B
```

Now make it a hundred engineers in forty projects, and look at what multiplies and what stays single:

| Multiplies with people | Stays one for the company |
|---|---|
| repo agents, one per project | each deck: one set of rules per kind of work |
| workers, as many per run as the work needs | each check: written once, shipped to every project through the template |
| briefs, recorded decisions, ledger nodes | the toolbox, and the rule that only owners grant tools |
| | the shop agents: one front-end agent, called by every project |
| | the ledger's single writer |

What grows is cheap and short-lived. What holds quality doesn't grow at all. A fix to a check reaches every project through the template. The front-end agent's craft lessons go into its own memory, and the facts about each project stay in that project's records, so it doesn't fill up with forty clients' details.

Before handing this to people who don't write code, it's worth asking whether each part earns its place.

## Does each part hold up?

The opening asked "why?" to find root causes. Run it the other way: from each part down to the failure it exists to stop. A part should land on something that happened, or at least on a named risk, and say what would show it's wrong.

| Part | Lands on | Event or risk | What would show it's wrong |
|---|---|---|---|
| Check | 19 of 20 runs ignored a rule in the prompt | event | a check that never fails on a planted break |
| Kernel kept apart from checks | a builder who can edit the judge loosens it | risk | an agent's edit that reaches `checks/` |
| Description as a trigger | the right procedure isn't called, or its steps get skipped | event (reported by others) | a playbook never called, or called and skipped |
| Agent split at an edge | per-topic agents with their own copies of rules | event | two agents with the same permissions, data and owner |
| Orchestrator as a script | a model makes fixed steps vary | risk | a run whose limits or retries differ for the same input |
| Memory in files | about 17 agreed items with no row anywhere | event | a decision that exists only in a chat |
| Deck, with who holds each rule | synapse's rules and checks drifted apart | event | two agents citing different versions of one rule |
| Eval before promotion | a new model version can break a playbook silently | risk | a suite that passes over zero tasks |
| Ledger node | "looked done" work that went stale and failed later | event | a green node whose evidence can't be cited |

Not all of it is proven. Whether a resident holds up under real load is untested. Whether task difficulty matters more than the number of rules is an idea with an experiment written and not yet run. The orchestrator rules come from one run. The shape holds where it's been tried, and says how it would be shown wrong where it hasn't.

## If you don't write code

I think there will be no such thing as low code or no code: everyone will code, only an agent types it for you. What you still need is the idea underneath: a script gives the same answer every time, and a model doesn't. Everything above is a way to move work across that line, and you don't need to read code to do it. You need to ask for the right things, in this order:

1. **Say what done looks like before anything is built.** Answer the five framing questions, or confirm the agent's guesses at them. A wrong guess here costs days later.
2. **Ask "can a script decide this?" of every rule you give.** If yes, have a check written for it, by someone other than the agent doing the work, and approve it yourself.
3. **Ask to see the check fail.** Have the work broken on purpose and watch the check catch it. A check you've never seen fail isn't a check yet.
4. **Keep two or three examples of good, and one of bad.** They're your taste, in a form checks and reviewers can measure against.
5. **Never accept "done" in words.** Ask for the check's output and the list of what wasn't verified.
6. **When it fails, ask for a rule with its case.** Not "be more careful", but a rule that names the failure, so the next run inherits it.
7. **Keep the decisions that can't be undone.** Merges, publishing, spending past a limit and anything touching security stay yours.

Here are steps 2 and 3 for someone in finance with an agent drafting supplier emails. "Every email names the purchase order" is a rule a script can decide, so a second agent writes the check, and it's shown failing before anyone trusts it:

```
you      > Can a script decide "every email names the purchase order"?
checker  > Yes: a PO number has a fixed form. Here is check_po.py;
           the drafting agent can't edit it.
$ check_po.py drafts/supplier-reminder.txt
FAIL  no purchase order number found          ← the check bites
$ check_po.py drafts/supplier-reminder-fixed.txt
ok
```

"Polite but firm" stays a rule, because no script can decide it, and your one good example email is what a reviewer measures it against. None of this needs you to read the code. It needs you to know which parts of your work are fixed and which need judgment, and that was always yours to know.

## What to remember

- A rule a script can decide belongs in a check, and the builder never edits the check.
- Make a new agent only for a new edge (permissions, data, owner), never for a topic; coordination is a script.
- Every rule carries the case that created it, rules move up on evidence, and an agent can always be demoted without asking.

For where the split between fixed steps and agents comes from, read Anthropic's essay *Building effective agents*.
