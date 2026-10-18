---
title: "Unknown is not zero"
excerpt: "A missing value that turns into a zero looks like an answer. It isn't one. The many quiet ways unknown becomes zero, and how I keep them apart."
category: software
date: 2026-10-18
cover: ridge-field~4
readTime: "4 min"
tags: ["Data", "Testing", "Observability", "Agents"]
---

One of my dashboards once told me that a whole set of jobs had wasted no memory at all. Zero. It was a clean, confident number, and I nearly moved on.

It was wrong. Those jobs had never recorded how much memory they'd asked for, so their waste couldn't be worked out at all. The query behind the number did `GREATEST(requested - used, 0)`, and in Postgres, `GREATEST` skips over missing values. A missing request came out as zero. "We don't know" had quietly become "nothing was wasted".

Nothing crashed. No test failed. The page looked fine. That's what makes this kind of bug dangerous: a wrong answer you can see gets fixed, but a gap that looks like an answer gets trusted.

Hospital heart monitors solved this a long time ago. If an electrode falls off a patient, the monitor doesn't draw a flat line. It sounds a "lead off" alarm instead. A flat line means the worst thing it could possibly mean. A loose wire means the opposite: nobody knows anything yet, so go and look. The people who designed those monitors refused to draw "no signal" the same way as "no heartbeat", because the nurse reading the screen acts on the difference.

Unknown is not zero. Most software draws the flat line anyway.

Once I'd seen it, I started finding it everywhere. In Python, `exit_code or "not recorded"` throws away a perfectly good exit code of 0, because zero is falsy. In JavaScript, `Number(null)` is 0, so a missing percentage shows up as "0.0%", and `?? 0` on a chart makes the line dip to zero exactly where the data is missing, instead of leaving a gap. In SQL, a condition like `state = 'FAILED' AND exit_signal = 0` is neither true nor false when the signal is missing, so the warning it was meant to raise never appears.

It happens in status too. Thousands of jobs that had run out of memory or time still reported exit code 0, so "it exited cleanly" said almost nothing about whether they'd worked. A mail command that returns success has only handed the mail on; it hasn't delivered it. A data collector passed every health check for days while no new data arrived, because "the process is up" and "the data is fresh" are two different questions. A function that swallowed its own errors returned an empty list, and a broken scheduler looked exactly like an idle one. An API that answered an empty success on a database error made a dead database look like "no matching jobs".

Every one of those questions had three possible answers: yes, no, and couldn't tell. The code only had room for two.

I could live with that in a dashboard. What really got me was finding it in the safety nets.

Tests are supposed to be the thing that catches all of this. Then I found a test helper that skipped any test that hit a database error, which meant six tests had been passing without running at all. I found a suite that skipped itself whenever the database was out of reach, with hundreds of tests that had quietly never run. When we finally ran them somewhere the database was reachable, two of them failed for real. And I found an evaluation run where every single case had been "not run", and the whole thing scored a pass. A check that looked at nothing had proven nothing, and it said so in green.

That was the moment it stopped being a bug class for me and became a rule. The check that's meant to catch silence can be silent too.

So these days I hold a few lines. Every check gets three outcomes, yes, no and couldn't run, and the third one is loud; a command-line tool gets a different exit code for "the answer is no" and "I couldn't ask". Missing stays missing, all the way from the database to the screen, where it shows as a dash, not a zero, because a dash makes you ask why and a zero makes you move on. A number says how it was known, measured or inferred, and when two sources disagree, both are shown. Every verdict comes with what it counted, and a check that selected nothing fails. And when a guard can't find the thing it's meant to protect, that's an error, not a pass.

Toyota has the same idea for factory lines. A line with no reported problems isn't a healthy line; it might be a line that's stopped reporting. Silence is the absence of reporting, not the absence of problems.

Agents have made this matter more than when I started. So much of the status I read now comes from an agent, and an agent that says "all tests pass" or "done" is giving me a self-report. A self-report is the most polished silence there is. It reads like evidence, and it isn't. So I don't take "done" from an agent. Done is a check that actually ran, on the real code, that tells me what it looked at and how much it found.

Which brings me back to the monitor. When something goes quiet, I don't want a flat line. I want the alarm that says the wire has come loose.
