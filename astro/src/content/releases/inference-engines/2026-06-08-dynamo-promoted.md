---
title: "Week of Jun 8 — NVIDIA Dynamo joins the board; flagships hold steady"
date: 2026-06-08
summary: "NVIDIA Dynamo is promoted from the wider field into the main list as the orchestration layer above vLLM/SGLang/TensorRT-LLM; flagship versions reconfirmed unchanged, with a new watchlist entry and a CNCF update for llm-d."
---

A quieter week on raw version numbers, but a notable structural change: the tracker now covers the orchestration layer, not just the engines themselves. The big move is promoting **NVIDIA Dynamo** into the main list.

## The headline: NVIDIA Dynamo, promoted

**[NVIDIA Dynamo](https://github.com/ai-dynamo/dynamo)** is now a tracked engine. It reached **1.0 GA at GTC (~March 2026)** and is already at **v1.1.1 (May 9 2026)** — Apache-2.0, ~6.8k GitHub stars, 29 releases. It cleared the promotion bar comfortably: mature releases, multiple credible sources, and real production adoption (Baseten, Mistral AI, Moonshot/Kimi, Dell, WEKA, plus Google GKE and AWS EKS recipes).

Dynamo isn't a from-scratch kernel engine — it's the **orchestration layer above vLLM, SGLang, and TensorRT-LLM**, turning a cluster of GPUs into one coordinated inference system. The pieces that matter: disaggregated prefill/decode on independently-scaled pools, KV-aware routing (~2x faster TTFT), a KV Block Manager that tiers cache from GPU → CPU → SSD → object storage, ModelExpress weight streaming for ~7x faster cold-starts, and an SLA-driven Planner that autoscales to hit latency targets at minimum TCO. New in 1.0: zero-config DGDR deploy, agentic per-request hints, multimodal encode/prefill/decode, and native video generation. It's overkill on a single node — reach for it when one box stops being enough. A new use-case entry ("coordinating inference across many GPUs or nodes") now points here.

## Engine changes

- **vLLM** — version reconfirmed at **v0.22.1 (Jun 5 2026)**. No change. (Worth flagging: the GitHub releases page currently serves a stale snapshot topping out at v0.20.2; the PyPI history confirms 0.21.0 → 0.22.0 → 0.22.1 are real. Always cross-check PyPI before deploying.)
- **SGLang** — reconfirmed at **v0.5.12.post1 (May 23 2026)**, same stale-GitHub-page caveat; PyPI confirms the 0.5.10 → 0.5.11 → 0.5.12 line. 0.5.12 brought the full DeepSeek-V4 path and a TokenSpeed MLA (Blackwell, FP8 KV) backend.
- **LMDeploy** — holds at **v0.13.0 (May 12 2026)**, confirmed via the project docs.
- **TensorRT-LLM** — rolling container **25.12**, unchanged.
- **llama.cpp** — still rolling (b87xx), but the project shipped an **official `llama.app` and website** this month to make local AI a one-click affair. Recent notes refreshed.
- **Ollama** — June drop adds **Gemma 4 QAT weights and Nemotron-3-Ultra**, **Metal GPU offload for multimodal models** on the llama.cpp backend (Apple Silicon), and `ollama launch` improvements (Qwen Code, Cline CLI, isolated Codex config) plus load-stall detection.
- **MLC-LLM**, **ExLlamaV3 + TabbyAPI** — no material change.
- **TGI** — still **archived/read-only since Mar 21 2026**. Hugging Face continues to point users at vLLM/SGLang for migration.

## Watchlist

- **Added — Aphrodite Engine**: PygmalionAI's vLLM-derived, high-throughput serving engine, **v0.21.0 (May 2 2026)**, AGPL-3.0. Popular for community endpoints; watching whether it differentiates beyond upstream vLLM.
- **Updated — llm-d**: accepted into the **CNCF Sandbox on Mar 24 2026**, backed by IBM, Red Hat, Google, CoreWeave and NVIDIA, and now shipping inside Red Hat AI Inference on CoreWeave/Azure with Tesla among early adopters (~3x throughput, ~2x faster TTFT vs round-robin). It's the strongest promotion candidate and the Kubernetes-native counterpart to Dynamo — but it's still **v0.5 with an explicitly unstable API**, so it stays on the watchlist until a stable 1.0.
- **NanoFlow**, **DeepSpeed-MII** — retained, no new signal this week.

## Benchmark notes

No new head-to-head numbers this week; the H100 picture is unchanged — **SGLang (~16,215 tok/s)** and **LMDeploy (~16,132)** still sit ~29% ahead of a fully-optimized **vLLM (~12,553)**. Dynamo's gains are orchestration-level (routing, disaggregation, autoscaling) rather than single-GPU throughput, so they're reported separately: ~2x faster TTFT, ~7x throughput/GPU on multi-node DeepSeek-R1, and headline figures up to 750x on GB300 NVL72 versus prior-generation baselines.

> Process note: this week reinforced that GitHub `/releases` snapshots can lag reality. Versions here were reconfirmed against PyPI / project docs before recording. Confirm against each project's release page before you deploy.
