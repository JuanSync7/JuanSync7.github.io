---
title: "rust-anything: let the agent write the port, let a recording decide when it is done"
date: 2026-11-22
summary: "rust-anything lets an agent rewrite code in Rust but leaves the verdict to recorded behaviour, a gate that proves agreement and not correctness."
---

The most useful idea in rust-anything is not Rust at all, it is who gets to say a rewrite is finished.

## A rewrite with a referee

[rust-anything](https://github.com/erkamyaman/rust-anything) is a command-line tool that helps you rewrite an app, or only its slow part, in Rust, and then proves the new code behaves like the old. It exists because rewrites are where quiet bugs come from. The new version looks right, passes the tests someone remembered to write, and then differs on an input nobody thought of.

It is for a developer with a working program in TypeScript, Python, Go, Ruby, Java, Kotlin or C who wants it faster or safer without breaking callers. A typical case is a Python script with one slow loop. You point the tool's `go` command at the script, and it profiles a run, picks the function that takes the time, records how that function behaves, and hands a Rust file to a coding agent to fill in. The Rust version is switched on only once it matches.

## How the loop works

The tool is built around four steps. First it records. It runs the original function on generated edge cases, known traps and inputs you supply, and saves what each call returns or throws. Second it bridges. It generates a Rust crate and a thin wrapper, so the rest of your code calls the Rust with the same signature as before. Third, someone writes the Rust, usually your agent and sometimes you. Fourth it checks. A `diff` command replays every recorded case against the Rust, and a `gate` command adds build and lint checks. A port is done when the gate passes, not when the agent says so.

Two details show the care behind it. The recording stores a fingerprint of the original files, so if the original changes later, the gate fails until you record again. And for whole apps it can record side effects as well as output, such as outgoing HTTP calls, emails and database state. Its own demo shows a rewrite that prints the same output but sends an email twice, and the replay catches it.

## What it takes and what state it is in

You install it with `cargo install rust-anything`, or from npm or a prebuilt binary, and then run `rust-anything setup`. That step registers an MCP server, a small service an agent can call, with each coding agent it finds, and copies a skill into their config folders under your home directory. It saves a backup of each file it changes and has a `--remove` flag. Its privacy page says the tool sends no code or telemetry anywhere, and what reaches the network is the package downloads and the advisory checks it runs.

It is MIT licensed and moves fast. The repo was created about a week before I read it, already calls itself version 3.3.0, and had close to 8,000 stars on GitHub. Its status page separates what was run on real code someone else wrote from what is only covered by its own test fixtures, which is more honest than most. The speed figures, such as Prettier formatting files 19 times faster, are the author's own runs on one Apple M4 machine.

## Where it stops

The docs are direct about this. A pass means the Rust agrees with every case that was recorded, and nothing more. An input nobody recorded, a regex that treats Unicode differently, timing under load, or a side effect that goes through a channel it does not watch can all still differ. There is also a plain warning that recording runs your original code many times, so it belongs on a copy with no production credentials. And moving a small function across the language bridge is often slower than leaving it alone, which the author says up front.

## Where I stand

On a first read this is the shape I believe in. I want agents doing bounded steps inside a mostly deterministic workflow, and here the agent only writes the port while three commands it does not control decide whether it is done. I also think Rust is underrated for systems-level AI infrastructure, so the destination does not put me off.

The first experiment I would run has nothing to do with speed. I would take one pure function from one of my own Python scripts, port it in a scratch copy, then plant a deliberate mistake in the Rust and check that the gate fails. If it catches the mistake and names the case, that would convince me the referee is real. The idea I would steal even without installing it is the recorded-behaviour gate, which could check any change to a converter or a generator against what the old one produced.

What I would check before anything else is the setup step. Writing an MCP server and a skill into every agent's home config is a lot of reach for a first install, and when in doubt about security I stay strict. I would wire it in by hand for one agent. Whether I would ever port something for speed, rather than read this for its checking method, is a question I have not answered.

Verdict: study.

## Also on the radar

- [alexeyw/lot-map](https://github.com/alexeyw/lot-map), a live local map of what Claude Code's tools, hooks and skills are doing. Study.
- [janestreet/agent_skills](https://github.com/janestreet/agent_skills), a published set of agent skills from a large engineering firm. Study.
- [Dodaios/ste80-humanizer](https://github.com/Dodaios/ste80-humanizer), a skill that rewrites text toward Simplified Technical English. Study.
- [shanselman/gputaskman](https://github.com/shanselman/gputaskman), a terminal task manager for GPU memory and KV cache. Watch.
- [NiazMorshed2007/reanimate](https://github.com/NiazMorshed2007/reanimate), a skill that copies an animation and claims to prove it moves the same. Watch.
- [BigPizzaV3/ClaudeMom](https://github.com/BigPizzaV3/ClaudeMom), skip and not recommended, because it works around a platform's account rules.
