---
title: "Unknown is not zero"
excerpt: "A missing value that turns into a zero looks like an answer. It isn't one. The many quiet ways unknown becomes zero, and how I keep them apart."
category: software
date: 2026-10-18
cover: ridge-field~4
readTime: "5 min"
tags: ["Data", "Testing", "Observability", "Agents"]
---

| | |
| --- | --- |
| **What** | The bug class I meet most often: a missing value quietly becoming a zero, a pass or a green light. |
| **Why** | A wrong answer you can see gets fixed. A gap dressed as an answer gets trusted. |
| **Who** | Anyone who builds dashboards, tests, monitors or agents that report status. |
| **When** | Every time code turns "I don't know" into a number or a verdict. |
| **Where** | SQL, Python, the frontend, exit codes, test suites, and agent reports. |

One of my dashboards once reported that a set of jobs had wasted zero memory. It was a confident, clean zero, and it was wrong. Those jobs had never recorded how much memory they asked for, so the waste couldn't be worked out at all. The SQL that computed it was `GREATEST(requested - used, 0)`. In Postgres, `GREATEST` ignores NULL, so a missing request came out as 0. "We don't know" became "nothing was wasted".

That bug is small. The pattern behind it is everywhere, and it's the one I now look for first.

## A flat line or a loose wire

Hospital heart monitors have a feature that makes the point better than I can. If an electrode falls off a patient, the screen doesn't draw a flat line. It shows a "lead off" alarm instead.

A flat line on that screen means one thing, and it's the worst thing it can mean. A loose wire means the opposite: nobody knows anything, so go and look. The monitor's designers refused to draw "no signal" the same way as "no heartbeat", because the people reading the screen act on the difference.

Most software draws the flat line.

## The many ways unknown becomes zero

I've collected these over a few months of building monitors, dashboards and agent tools. None of them crashed. All of them showed a reasonable-looking answer.

**In code**
- Python truthiness: `exit_code or "not recorded"` turned a clean exit code of 0 into missing data. Zero is falsy, so the real value was thrown away. Test for `None`, never for falsy.
- JavaScript: `Number(null)` is 0, so a missing percentage rendered as "0.0%". And `?? 0` on measured data stops a chart from drawing the gap where data is missing; the line just dips to zero.
- SQL logic: `state = 'FAILED' AND exit_signal = 0` is neither true nor false when the signal is missing. It's NULL, so the warning badge it guarded never rendered.

**In status**
- Exit code 0 is not success. Thousands of jobs that had run out of memory or time still reported exit 0. The real state was elsewhere.
- `sendmail` returning 0 means the mail was accepted, not delivered. It can still be dropped quietly further on.
- A collector passed every liveness check while no new data had arrived for days. "The process is up" and "the data is fresh" are two different questions.
- A function that swallowed its errors and returned an empty list made a broken scheduler look like an idle one. Empty and broken looked exactly alike.
- An API that returned an empty `200` on a database error made a dead database look like "no matching jobs".

**In tests**
- A test helper that skipped on any SQL error made six tests pass without running.
- A suite that skipped when the database was unreachable had hundreds of tests that had quietly never run. Running them where the database was reachable found two real failures.
- A live eval where every case was "not run" scored a pass. A check that selected nothing has proven nothing.

The common thread is that each one has three possible answers, *yes*, *no* and *couldn't tell*, and the code had room for only two.

## How I keep them apart

**Give every check three outcomes.** Yes, no, and could not run. Make the third one loud. For command-line tools that means separate exit codes for "the answer is no" and "I couldn't ask"; one code for both hides a broken check behind a negative answer.

**Carry null all the way to the pixel.** Keep "missing" as its own value through the database, the API and the frontend, and render it as a dash, not a zero. A dash makes a reader ask why. A zero makes them move on.

**Label how you know.** When a number is measured, say so. When it's inferred, say that too, and when two sources disagree, show both. I tag figures as exact, inferred or contested, and an unverified check reads UNVERIFIED, never CLEAN.

**Count what was checked.** Every verdict should come with its denominator. "All 0 checks passed" is a failure. Require a minimum number of items, and fail when a check selects nothing.

**Fail loud rather than look clean.** When a guard can't find the thing it protects, that's an error, not a pass. An honest error is easier to live with than a clean report that's wrong.

## Silence is not good news

Toyota has a version of this for factories: a line with no reported problems isn't a healthy line, it's a line that isn't reporting. I wrote about that in [Decide slowly, then move fast](/blog/decide-slowly-move-fast). A chip block with no regression results isn't passing. No evidence is unknown, never green.

## Why agents make this worse

This matters more now than when I started, because so much status is reported by agents. An agent that says "all tests pass" or "done" is giving you a self-report, and a self-report is the most polished kind of silence there is. It reads like evidence and it isn't.

So I don't take "done" from an agent. Done is a check that ran, on the real tree, and says what it looked at and how many things it found. When the check can't run, I want it to say so in capitals. When a value isn't there, I want a dash. A loose wire should look like a loose wire.
