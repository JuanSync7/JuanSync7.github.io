---
title: "Unknown is not zero"
excerpt: "A missing value that turns into a zero looks like an answer, and that is exactly why it gets trusted."
category: software
date: 2026-10-18
cover: ridge-field~4
readTime: "5 min"
tags: ["Data", "Testing", "Observability", "Agents"]
---

One of my dashboards once told me that a whole set of jobs had wasted no memory at all. Zero. It was a clean, confident number, and I nearly moved on.

It was wrong. Those jobs had never recorded how much memory they'd asked for, so their waste couldn't be worked out at all. The query behind the number did `GREATEST(requested - used, 0)`, and in Postgres, `GREATEST` skips over missing values. A missing request came out as zero. "We don't know" had quietly become "nothing was wasted".

Nothing crashed. No test failed. The page looked fine. That's what makes this kind of bug dangerous: a wrong answer you can see gets fixed, but a gap that looks like an answer gets trusted.

Hospital heart monitors solved this a long time ago. If an electrode falls off a patient, the monitor doesn't draw a flat line. It sounds a "lead off" alarm instead. A flat line means the worst thing it could possibly mean. A loose wire means the opposite: nobody knows anything yet, so go and look. The people who designed those monitors refused to draw "no signal" the same way as "no heartbeat", because the nurse reading the screen acts on the difference.

Unknown is not zero. Most software draws the flat line anyway.

## Once I saw it, it was everywhere

In code, it hides in the small conveniences:

- Python: `exit_code or "not recorded"` throws away a perfectly good exit code of 0, because zero is falsy.
- JavaScript: `Number(null)` is 0, so a missing percentage shows as "0.0%". And `?? 0` on a chart makes the line dip to zero exactly where the data is missing, instead of leaving a gap.
- SQL: `state = 'FAILED' AND exit_signal = 0` is neither true nor false when the signal is missing, so the warning it was meant to raise never appears.

In status, it hides in signals that sound like success:

- Thousands of jobs that had run out of memory or time still reported exit code 0. "It exited cleanly" said almost nothing.
- A mail command that returns success has only handed the mail on. It hasn't delivered it.
- A data collector passed every health check for days while no new data arrived. "The process is up" and "the data is fresh" are different questions.
- A function that swallowed its own errors returned an empty list, and a broken scheduler looked exactly like an idle one.
- An API that answered an empty success on a database error made a dead database look like "no matching jobs".

Every one of those questions had three possible answers: yes, no, and couldn't tell. The code only had room for two.

## Then I found it in the tests

I could live with that in a dashboard. What really got me was finding it in the safety nets.

Tests are supposed to be the thing that catches all of this. Then I found a test helper that skipped any test that hit a database error, which meant six tests had been passing without running at all. I found a suite that skipped itself whenever the database was out of reach, with hundreds of tests that had quietly never run. When we finally ran them somewhere the database was reachable, two of them failed for real. And I found an evaluation run where every single case had been "not run", and the whole thing scored a pass. A check that looked at nothing had proven nothing, and it said so in green.

That was the moment it stopped being a bug class for me and became a rule. The check that's meant to catch silence can be silent too.

## The lines I hold now

**Every check has three outcomes.** Yes, no, and couldn't run, and the third one is loud. A command-line tool gets a different exit code for "the answer is no" and "I couldn't ask".

**Missing stays missing, all the way to the screen.** Through the database, the API and the page, a missing value shows as a dash, not a zero. A dash makes you ask why. A zero makes you move on.

**A number says how it was known.** Measured or inferred, and when two sources disagree, both are shown.

**A verdict says what it counted.** "All checks passed" means nothing without how many. A check that selected nothing fails.

**A guard that can't find its subject fails.** If the thing it protects isn't there, that's an error, not a pass.

## Why agents make it worse

Toyota has the same idea for factory lines. A line with no reported problems isn't a healthy line; it might be a line that's stopped reporting. Silence is the absence of reporting, not the absence of problems.

Agents have made this matter more than when I started. So much of the status I read now comes from an agent, and an agent that says "all tests pass" or "done" is giving me a self-report. A self-report is the most polished silence there is. It reads like evidence, and it isn't. So I don't take "done" from an agent. Done is a check that actually ran, on the real code, that tells me what it looked at and how much it found.

Which brings me back to the monitor. When something goes quiet, I don't want a flat line. I want the alarm that says the wire has come loose.
