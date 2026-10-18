---
title: "Build the bump, not the sign"
excerpt: "Most of the rules I wrote for my agents either never reached them or quietly stopped being true, until I started writing the check instead."
category: thoughts
date: 2026-10-18
cover: pattern-cards~6
readTime: "6 min"
tags: ["Agents", "Rules", "CI", "Process"]
---

One of my projects had a rule file that reached 1,016 lines.

I'd asked for it. Every time I asked for the file to be made "complete" or "robust", it got longer, and I didn't notice it growing. It felt like progress. More rules meant fewer surprises, or so I thought, and the file read like a careful engineer had written it.

But not one of those 1,016 lines had been turned into something that could fail on its own. Each rule held only if an agent read it, at the right moment, and chose to follow it. The only way to find out whether it had was to catch it breaking.

So why does writing a rule down feel like solving the problem, when so often it doesn't?

Roads answered this a long time ago. A speed limit sign only works if a driver sees it, reads it and chooses to obey it. That's three chances to fail, and a sign behind a tree fails all three. A speed bump needs none of them. Nobody has to read it, remember it or agree with it. The road itself holds the rule.

A rule in a file is a sign. A check that runs is a bump. Don't write the sign. Build the bump.

## Two ways a rule dies

Once I started looking, I found that my rules died in one of two ways.

The first is that they never arrive. A rule only works if it's in front of the agent at the moment it matters, and a lot of mine weren't. I had a whole deck of rules for writing rule files, carefully sourced, each one tied to a real mistake, and nothing loaded it. It sat in my notes, correct and useless. A long file has the same problem in a quieter form: the agent reads it, but the rule on line 800 has to compete with 799 others for attention, and it loses.

The second is that they drift. A rule that nobody checks stays true only as long as everyone remembers it, and nobody remembers it. The code moves, the rule doesn't, and a few weeks later the file describes a system that no longer exists. That's worse than no rule at all, because an agent will follow it faithfully.

Both deaths have the same cause. The rule depends on someone reading it, at the right time, and caring.

## The gate that would reject everything

I didn't really believe how bad drift could get until I had a framework for agent skills audited, one I'd built a lot of my own rules on.

Its rules were good. Several of mine came straight from it: say only when to use a skill, trace every instruction to a failure, give every skill a clear flow. It had a validator, a pre-commit hook, and a gatekeeper skill whose job was to decide whether a new skill was good enough to land.

Run over the whole tree, its validator exited with 114 errors.

Then it got stranger. The framework had two different rules for what a skill's header should look like, written in two different places. The hook checked one. The gatekeeper checked the other. Every one of the 33 skills followed the first, so the framework's own quality gate would have rejected every skill in the repo. Most skills were missing the flow section that the rules said every skill must have, always. The gatekeeper itself was still marked as a draft.

How had nobody noticed? Because the hook only checked the files you'd just changed. Anything you didn't touch was never looked at again, and nothing ran the validator over the whole tree in CI. The rules were all still written down, all still correct. The checks had simply stopped covering the ground they were written for.

That's when it clicked for me. The good rules weren't the valuable part. The checks were, and the checks had a hole in them the shape of everything nobody was editing.

## Now every rule starts with one question

So I changed how I write rules. Before anything goes into a file, I ask whether a script, a test or a hook can check it. If it can, I write the check and leave one line in the file pointing at it. The line says why. The check does the holding.

What's left over still gets written down, but in a fixed shape:

- **The rule**, in one sentence.
- **The real failure it prevents**, with the case that created it. A rule with no case behind it gets dropped.
- **Where the detail lives**, so the rule doesn't have to carry it.
- **Who holds it**: code, the writer, or a reviewer. If the answer is "the writer", that's a convention, and it's labelled as one.

And a check only counts if it runs over the whole tree, every time, in CI. A check that only looks at what changed is a check that slowly stops looking.

The most recent example is the post you're reading. The rules for how I want a blog post to read started as prose in my notes: one hook sentence under the title, three to five headings at the turns of the story, no links to other posts until the end, a length you can read in one sitting. Most of that is now a script that runs on every build and fails it. That script has its own test, too: a broken post for every rule, and if the script ever stops catching one, the build fails. What a script can't judge, like whether the story actually has an arc, goes to a fresh reader who has never seen the draft.

## A road with fewer signs

That 1,016-line file is the next road I want to fix, and I know now how I'll read it. Some of its rules are checks in disguise, waiting to be written. Some are notes about how the code works, which belong in the docs. A few are real judgment calls, and those can stay.

Fewer signs, then. Where the road can hold a rule, build the bump, and put one small sign next to it that says why it's there.
