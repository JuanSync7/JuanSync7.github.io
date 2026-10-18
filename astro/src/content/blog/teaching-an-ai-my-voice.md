---
title: "Teaching an AI to write like me"
excerpt: "I gave an AI a careful list of rules for how I write, and every draft followed them and still didn't sound like me."
category: thoughts
date: 2026-10-18
cover: vector-space~7
readTime: "6 min"
tags: ["Writing", "Agents", "LLM", "Process"]
---

A while ago I wrote down how I sound.

Small words. Humble confidence: sure where I'm sure, unsure only where I really am. Direct, but kind. And one thing I care about more than the rest: when an idea is hard, explain it through some completely unrelated system from the real world, the way the engineer behind Japan's bullet train borrowed the shape of a kingfisher's beak to quiet the boom as it left a tunnel. I turned all of it into a short list of rules, each with a way to check it. The idea was simple. Agents write a lot of my documents now, and I wanted those documents to sound like me.

Then I asked for my first three blog posts, written from my own notes, with those rules loaded. The drafts came back clean. Every rule was followed. Small words, a careful analogy, no fake confidence.

And they didn't read like me at all. They read like a well-made reference page.

So if every rule was followed, what was missing?

Any musician could have told me. You can't learn to play like a pianist from a list of words about their playing: light touch, sparse left hand, swung in the slow bits. Every one of those words can be true, and you can obey all of them, and you still won't sound like them. You learn it from the recordings, and from playing it through, start to end, until you can hear where it's going.

You don't learn a voice from its rules. You learn it by hearing it.

## What the first drafts looked like

Each of the first drafts opened with a little table: what, why, who, when, where. Then a heading every few paragraphs, one per idea. Numbered lists. Links from each post to the others, right in the middle of the text. Everything was findable. Nothing pulled you forward.

Rather than list what was wrong, I described how I wanted it to feel. Read it like a book. Like a song, even: a start, a build, a chorus, the moment it peaks, a bridge that turns it, and an ending that lands. One long stream of thought, not a map that tries to link everything to everything.

The rewrites did exactly that. No tables, no headings, no links. Just the story, one paragraph leading into the next. They read much better.

## Where the table came from

Then I saw where that table had come from. It was my own rule.

The five-W table was in my notes on technical writing, and I'd put it there on purpose. For a README or a design doc, a reader wants to know straight away what this is, why it exists, who owns it, and where to look. The table is perfect for that. I just hadn't said that it was only for code docs, so the agent did the reasonable thing and applied it to everything I write. In a blog post it sat right where the hook should be, a form to fill in before the story could start.

The drafts had a second problem, caught only on a careful read. One of them had me writing software tests by hand. I don't. Agents write nearly all of my code, and I direct and review it. The line sounded right, it fit the paragraph, and it wasn't true. A voice that makes things up about me isn't my voice.

Both of those came from the same place. Rules can say how a sentence should sound. They can't say which kind of writing you're in, or what actually happened.

## A reader who didn't know which was new

The stream version felt better to me. But I'd asked for it, so of course it did. I wanted a reader without that bias.

So a fresh agent read both versions of each post, with the labels shuffled, without knowing which one was newer or what I'd said about them. It preferred the stream version for all three: strongly for one, clearly for another, only slightly for the third. And then it told me what the stream had lost. The posts were hard to skim. A couple of details had dropped out. And in one post, the rules a reader would come back for were buried in paragraphs.

Its fix beat both versions. Keep the story as the spine. Put one strong sentence under the title as the hook. Add three to five headings, but only at the turns of the story, and word them as beats rather than labels. Use lists only where the content really is a list.

That's the shape of the post you're reading now.

## Rules last, and the recordings still missing

Only after all that did I go back to the rules:

- **Blog posts got their own note**, separate from code docs, so the five-W table stays where it belongs.
- **What a script can check became a check** that runs on every build: the single hook sentence, the number of headings, no links until the end, a length you can read in one sitting.
- **What it can't check goes to a blind reader** before anything is merged, like whether there's really an arc.
- **Every draft and the reader's verdict became worked examples** in my notes, because an agent copies an example far better than it follows a rule.

There's one page in those notes that's still empty, and it's the one that matters most. It's meant to hold a few things I wrote myself, with no AI anywhere near them. My rules are a description of my playing. Those samples would be the recordings.

So I don't think I've taught an AI my voice yet. I've given it good sheet music, and a reader who can tell when it's played wrong. The recordings are still on me.
