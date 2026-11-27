---
title: "SkillEvaluator: three questions to ask of an agent skill, and the first needs no model"
date: 2026-11-23
summary: "NVIDIA's SkillEvaluator asks three separate questions about an agent skill, and the first one needs no model at all."
---

A skill that an agent never loads is worse than no skill at all, because you think the agent knows something it does not.

## What it is and why it exists

[SkillEvaluator](https://github.com/NVIDIA/SkillEvaluator) is NVIDIA's open tool for checking agent skills, the folders of instructions and scripts that coding agents such as Claude Code or Codex load when a task matches. It exists because skills are now shared and installed like packages, yet most people judge one by reading it and hoping. A skill can be cut off by the agent's length limits, repeat what another skill already says, hide something unsafe in a script, or simply not make the agent any better.

It is for anyone who writes or reviews skills, from one person with a folder of them to a team that publishes them. A typical case is a pull request that edits a skill's description. A CI check runs the tool on the changed folder and fails the merge if the new description is too long for one of the agents it must work with.

## Three questions, kept apart

The design rests on three tiers, and each answers a different question.

The first tier asks whether the skill is well formed and safe. It is static, so it reads files and runs scanners but never calls a model. It checks the skill's form, looks for personal data and secrets, lints scripts, and runs security scanners, including NVIDIA's own SkillSpector, which looks for prompt injection and data being sent out. Inside this tier sits the harness check. It holds versioned profiles of what each agent accepts and reports, for each one, whether the skill loads, loads in a degraded form, or does not load at all. Its example shows a description that is four characters over one agent's limit, so that agent never lists the skill.

The second tier asks whether the guidance repeats itself or overlaps other skills. It compares text with embeddings, which turn passages into numbers so that similar meanings sit close together, and it can check a skill against a whole catalogue.

The third tier asks the question the other two cannot, which is whether the skill helps. It runs a real agent in a sandbox on a set of tasks, with and without the skill, and grades the results. It can draft a starter task set from the skill, but the docs say to review those cases and warn that the starter covers little.

## Getting it running

`pip install skillevaluator` gets the command line tool, and `skillevaluator quality-check ./my-skill` gives a score out of 100 with no key, scanner, GPU or Docker. Full first-tier coverage needs the outside scanners installed, and a scanner that cannot run marks the result incomplete instead of passing it quietly. The second and third tiers need a model provider. The README points to free hosted endpoints from NVIDIA for prototyping, which means sending the skill and its tasks to them, and the third tier needs Docker running. For CI, `skillevaluator ci init` opens a pull request that adds the checks.

## How mature it is

It is under the Apache 2.0 licence, had about 4,600 stars on GitHub when I checked, and was pushed to in the last week. It dates from June and has versioned CI templates and a paper on arXiv. NVIDIA labels its support as experimental, community only, with no guarantee. Its quickstart is honest about limits. A good static score is only static quality, and it does not show security coverage or that an agent benefits.

## Where I stand

This is the one I would actually try. I want anything that can be deterministic to be deterministic, so it is a reflex and not something to remember, and the first tier is exactly that for skills. It runs with no model, gives the same answer twice, and catches a class of failure I cannot see by reading a skill, which is an agent quietly refusing to load it.

The first experiment is small. I would run `skillevaluator harness-check` and the keyless first tier on two of my own skills in a scratch copy. If it flags a real loading problem, or a description problem my own writing rules for skills also name, it earns a place in my checks. If it only produces noise I already knew, it does not.

The idea worth stealing is keeping the three questions apart. Well formed, not repeated and actually useful are different claims, and a tool that blurs them gives one score that means nothing. What I would check before going further is the network. When in doubt about security I stay strict, so I would read exactly what the scanners and the hosted feedback send out before pointing it at private skills, and I would keep the third tier off until I knew where my skills were going.

Verdict: use, starting with the first tier only.

## Also on the radar

- [NVIDIA/SkillSpector](https://github.com/NVIDIA/SkillSpector), a security scanner for skills before you install them. Use, after checking what it sends out.
- [therandomsecurityguy/signet](https://github.com/therandomsecurityguy/signet), a registry for agents and skills with signed publication. Study.
- [benchflow-ai/skillsbench](https://github.com/benchflow-ai/skillsbench), a benchmark of whether skills help agents. Study.
- [EL4CTEO/fast-anything](https://github.com/EL4CTEO/fast-anything), ports only an app's hot functions to Rust. Watch.
- [diego3g/craft](https://github.com/diego3g/craft), design skills that review screens against a design system. Watch, licence unconfirmed.
- [pierridotite/mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers), agents that test apps on phone simulators. Watch.
