---
title: "What a hash can and can't prove"
excerpt: "A hash proves the bytes haven't changed, which is a lot, and it's very easy to let it vouch for much more than that."
category: software
date: 2026-10-18
cover: tunnel~7
readTime: "6 min"
tags: ["Hashing", "Provenance", "Security", "Ledgers"]
---

In chip design, the files that matter live in a release area. The constraints, the power intent and the netlists that a run depends on are copied there, marked read-only, and everyone agrees not to touch them. It works most of the time. But read-only is a promise about a path. Someone with the right permissions can still edit a file in place, or copy a new one over the old one, and the path looks exactly the same afterwards.

A hash doesn't have that problem. Run SHA-256 over a file's bytes and you get a 64-character fingerprint. Change one byte and the fingerprint changes completely. It doesn't care about the path, the name, the timestamp or who owns the file. A path is a promise. A hash is a fact about the bytes.

That one idea now sits under most of the ledger I'm building to track design work. I've caught myself describing it as "everything uses a hash, like a blockchain", and saying it with real confidence.

So how much does that fact actually prove?

Letters had an answer centuries ago. A wax seal on a letter shows that nobody opened it after it was sealed. Break the seal and anyone can see it. But the seal says nothing about whether the letter is true. It doesn't even say who wrote it, only that someone with that seal pressed it. And a seal that the sender also checks on arrival proves nothing at all.

A hash is a seal. It proves the bytes didn't change. Everything else, you have to bring yourself.

## What a seal is good for

Inside those limits, a hash does a lot of work, and I lean on it hard.

- **Identity.** Every file the ledger records carries its content hash. Two files with the same hash are the same file, wherever they live.
- **Staleness.** Each step of the work has an input hash, built from the hashes of everything it consumed: the files from the steps before it, its recipe, its settings. When one input changes, exactly the steps downstream of it go stale, and nothing else does.
- **Firewalls.** If a step reruns and produces a byte-identical result, everything after it stays fresh. A block can be rebuilt without dragging the whole chip back through checks.
- **Caching.** The same input hash means the same answer, so the work can be skipped.

I keep one rule here: the hash decides, and the timestamp is only a shortcut. A timestamp can skip a rerun that was needed. A hash can't.

## Only as strong as what you declared

The first limit I hit was quieter than I expected.

A step's input hash covers the inputs the step says it used. It can't cover what the tool actually read. If a script quietly pulls in a library from somewhere else, that file is invisible to the hash, and the step stays green when it changes. The ledger checks the file you say you used, not the one your tool opened.

The sharpest version of this turned up while I was designing it. Upgrading a tool could leave sign-off marked as passed, because the version in the recipe was the version of the recipe, not of the tool. Nothing anyone had declared had changed, so nothing went stale. The answer is to treat tool versions, environment and library paths as inputs too, recorded with every run, so they're part of what the hash covers.

A hash is a perfect witness to what it was shown. The work is in deciding what it gets shown.

## Then I looked at my own seal

The bigger limit was in that line I was so sure of. "Like a blockchain."

A hash protects files. It doesn't protect records: the line in the ledger that says this file passed this check, run by this person, on this day. For that you chain the records, so each one carries the hash of the one before it, and changing any old record breaks every link after it. That shows a record wasn't changed after it was written. It still doesn't show the record was true when it was written, or who wrote it.

And a blockchain isn't trusted because of the hashes. It's trusted because many people who don't trust each other all check the same chain. What I was building was the opposite: one keeper writing the records and one keeper checking them.

When I asked for a plain report of where the ledger actually stood, it came back plainer than my pitch. The record history was append-only, from one writer, and attributed. But the chain itself was still a design, with no code. The store would accept a hash someone had simply typed in. The same user who wrote the records could switch off the guards that protected them. Anyone could check the ledger, but only by running the ledger's own code, under the same trust as the writer. There was no checker outside the thing being checked.

I had built a very good seal, and then I'd handed the sender the job of checking it on arrival.

## A seal someone else can check

What closes the gap isn't more hashing. It's putting part of the check where the keeper can't reach it:

- **An identity the writer can't borrow**, so a record says who wrote it and that can't be faked by passing a name.
- **A copy of the chain's head held somewhere the writer can't rewrite**, like a commit made under a different account, to a repo the writer can't push to.
- **A replay anyone can run** on a copy, which rebuilds the state from the log and has to land on the same answer.

None of that is clever, and that's rather the point. Until it exists, the chain is shown as a prototype, and the honest word for the ledger is tamper-evident, not tamper-proof.

A seal is worth something because the person who breaks it didn't make it. The hash proves the bytes didn't change. The rest, who wrote it, whether it's true, whether anyone outside could tell, I have to bring myself.
