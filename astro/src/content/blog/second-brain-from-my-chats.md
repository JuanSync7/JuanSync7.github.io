---
title: "A second brain built from my chats"
excerpt: "I couldn't remember half of what I'd built, so I had my AI chats write it down, and the hard part was keeping the record honest."
category: projects
date: 2026-10-18
cover: city-form~12
readTime: "6 min"
tags: ["Knowledge", "Obsidian", "Agents", "LLM"]
---

I'd solved a lot of problems that year, and for most of them I could no longer tell you how. I remembered that I'd solved them. The how and the why had gone, along with the dead ends that taught me anything.

I had worked across a lot of projects, nearly all of it in conversation with an AI. Thousands of chat sessions, spread over a Linux machine, a Windows one and the web. Every decision I'd made was in there somewhere, explained at the time, with the reasons still fresh. And the coding tool I use most deletes its local chat logs after thirty days. My best record of my own work was quietly being thrown away.

So the question was simple. If the chats already hold the story, why am I trying to remember it?

Ships worked this out a long time ago. A captain doesn't remember every watch. The officer on duty writes the log as things happen: the course, the weather, what went wrong. It's written at the time, not afterwards from memory, and that's why it's trusted. But the log doesn't decide where the ship is going. The captain reads it, and signs it.

That became the whole design. The machine keeps the log. I keep the meaning.

## The first graph was just noise

I started with Obsidian and a plugin that puts Claude inside it, and the first thing I did was point it at every chat and draw the graph. It looked impressive for about a minute. Then I filtered out the automated runs and found that only 34 of about 3,050 sessions were real conversations. The rest were jobs talking to themselves. The graph was activity, not experience.

What I actually wanted to remember was smaller and more useful: what I built, how, why, and what I learned. So each day's chats went through a model that wrote one note per piece of work and one per skill. The first pass made 231 feature notes and 94 skill notes for $11.15. For the first time I could ask "how did I handle retries?" and get my own answer back, with links to the day it happened.

Then I made the split that everything else rests on. The vault has two halves:

- **Generated:** rebuilt from the chats every night. Project pages, work items, a wiki of every tool and idea I've touched, a timeline. I never edit it, because the next build would erase my edits.
- **Mine:** notes I write or approve, never overwritten. Who I am, the principles I've stated, rule decks, corrections. The generator reads these as the truth, and may not contradict them.

It runs on a timer at night: pull the chats, summarise them, rebuild the pages, check them, push.

## The night it wrote nothing over everything

The first nightly run was the one I'd been waiting for. The next morning, the vault was empty.

The run had hit my weekly usage limit partway through. Every call after that failed, and the pipeline treated each failure as an empty answer. It then did exactly what it was built to do: it rebuilt every page from what it had, and what it had was nothing. Every page, replaced with a blank.

It was fixable. But it changed how I thought about the whole thing. A pipeline that runs while I sleep can't ask me anything. So it has to be built to stop. Now a failed call keeps the last good result. A partial run never mixes old pages with new ones. The run stops before it pushes if anything is off, and a check over the whole vault has to pass before anything leaves the machine.

Money needed the same treatment, and I learned that one more slowly. A few weeks later the nightly run kept spending its whole budget and never publishing. About $65 went over four nights with nothing to show. The cause was small: the cache keys were built from text that changed whenever my privacy filter changed, so every night looked new, and everything was summarised again. Now each stage has its own cap, every call reserves its money first, and a run that hits a cap carries on the next night instead of starting over.

None of this was about the model. The model was fine. Everything that went wrong was in the plumbing around it.

## It knew what I did, not what I know

Once the pipeline was steady, I read the pages properly, and something was off.

They were accurate. They were also thin. The summariser only saw what I'd typed into chats, and most of what I know about chip design never came up in a chat, because I already knew it. The vault made me look like an AI engineer who'd read about chips. Every page was true, and the picture they made together was wrong.

The fix was to stop asking the log to do the captain's job. Now there's a queue of questions about what I actually know, and in an interview Claude drafts a note only from my answers, shows it to me, and files it once I've read it. Those notes are the ones marked as mine.

The same line runs through every wiki page. Where I've written my own note on a topic, the page has a section called "My take". Where I haven't, the same section is called "Inferred stance (Claude)", and it says plainly that it's the model's reading of my chats, not my words. Even the short profile that every new Claude session loads about me is a frozen copy that only I edit. The generator can propose changes to it, as a numbered list, but it can't make them.

That turned out to matter more than any of the clever parts. A second brain that sounds sure about everything is worse than none, because I'd start believing it. One that says "this is what I think you think" is one I can correct.

## The log and the signature

It still isn't finished. My own writing samples are still an empty page, and a few question notes are waiting on answers only I can give.

But the shape holds. Every night, the machine writes down what happened while it's still true. Every so often, I read it and sign what's mine. The machine keeps the log. I keep the meaning.
